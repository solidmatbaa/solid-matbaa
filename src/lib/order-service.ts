import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotificationContent, sendCustomOrderApprovedEmail, sendRejectionEmail, sendStatusEmail } from "@/lib/email";
import {
  expandStatusesForQuery,
  isOrderArchivedStatus,
  normalizeOrderStatus,
  parseOrderStatusInput,
  toDbOrderStatus,
  validateOrderStatusUpdate,
  validateReturnStatusUpdate,
} from "@/lib/order-transitions";
import { shippingUpdatePayload } from "@/lib/shipping";
import { PAYMENT_RECEIPTS_BUCKET, uploadPaymentReceipt } from "@/lib/storage";
import { BANK_ACCOUNT_HOLDER_NAME } from "@/lib/payment-details";
import type { Locale, OrderStatus, OrderType, ReturnStatus, ShippingInfo } from "@/types";

type AdminClient = SupabaseClient;

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  size: string | null;
  specs: Record<string, string> | null;
}

interface OrderWithCustomer {
  id: string;
  user_id: string;
  tenant_id: string;
  status: OrderStatus;
  order_type: OrderType;
  total_amount: number;
  order_items?: OrderItemRow[];
  profiles: {
    full_name: string | null;
    email: string | null;
    locale: Locale;
  } | null;
}

async function notifyCustomer(
  admin: AdminClient,
  order: OrderWithCustomer,
  status: string,
  orderId: string
) {
  const locale = (order.profiles?.locale ?? "en") as Locale;
  const notif = getNotificationContent(status, orderId);

  await admin.from("notifications").insert({
    user_id: order.user_id,
    tenant_id: order.tenant_id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    order_id: orderId,
  });

  if (order.profiles?.email) {
    await sendStatusEmail(order.profiles.email, status, locale, {
      name: order.profiles.full_name ?? "Customer",
      orderId,
      total: String(order.total_amount),
    });
  }
}

async function notifyTenantAdmins(
  admin: AdminClient,
  tenantId: string,
  notification: {
    type: string;
    title: Record<string, string>;
    message: Record<string, string>;
    order_id: string;
  }
) {
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("role", "admin");

  if (!admins?.length) return;

  await admin.from("notifications").insert(
    admins.map((adminProfile) => ({
      user_id: adminProfile.id,
      tenant_id: tenantId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      order_id: notification.order_id,
    }))
  );
}

export async function transitionOrderStatus(
  admin: AdminClient,
  orderId: string,
  nextStatusInput: OrderStatus | string,
  options?: {
    shippingInfo?: ShippingInfo;
    rejectionReason?: string;
    price?: number;
    adminNotes?: string;
  }
): Promise<{ ok: true; deleted?: boolean } | { ok: false; error: string }> {
  const parsedStatus = parseOrderStatusInput(nextStatusInput);
  if (!parsedStatus.ok) {
    return { ok: false, error: parsedStatus.error };
  }
  const nextStatus = parsedStatus.app;
  const dbStatus = parsedStatus.db;

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("*, order_items(*), profiles(full_name, email, locale)")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { ok: false, error: "Order not found" };
  }

  const current = normalizeOrderStatus(String(order.status));
  const orderType = String(order.order_type) as OrderType;
  const validation = validateOrderStatusUpdate(
    current,
    nextStatus,
    options?.shippingInfo,
    orderType
  );

  if (!validation.ok) {
    return validation;
  }

  if (nextStatus === "rejected") {
    const reason = options?.rejectionReason?.trim();
    if (!reason || reason.length < 3) {
      return { ok: false, error: "Rejection reason is required" };
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: "rejected",
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const customer = order as OrderWithCustomer;
    const locale = (customer.profiles?.locale ?? "en") as Locale;

    if (customer.profiles?.email) {
      await sendRejectionEmail(customer.profiles.email, locale, {
        name: customer.profiles.full_name ?? "Customer",
        orderId,
        reason,
        total: String(order.total_amount),
      });
    }

    await admin.from("notifications").insert({
      user_id: order.user_id,
      tenant_id: order.tenant_id,
      type: "order_rejected",
      title: getNotificationContent("rejected", orderId).title,
      message: {
        en: `Order ${orderId} was rejected. Reason: ${reason}`,
        ar: `تم رفض الطلب ${orderId}. السبب: ${reason}`,
        tr: `${orderId} numaralı sipariş reddedildi. Sebep: ${reason}`,
      },
      order_id: orderId,
    });

    return { ok: true };
  }

  const updatePayload: Record<string, unknown> = {
    status: dbStatus,
    is_archived: isOrderArchivedStatus(nextStatus),
  };

  if (options?.shippingInfo) {
    Object.assign(updatePayload, shippingUpdatePayload(options.shippingInfo));
  }

  if (options?.price !== undefined) {
    updatePayload.total_amount = options.price;
  }

  if (options?.adminNotes?.trim()) {
    updatePayload.admin_notes = options.adminNotes.trim();
  }

  if (
    (current === "paid" || current === "payment_submitted") &&
    nextStatus === "pending_payment"
  ) {
    updatePayload.receipt_url = null;
    updatePayload.account_holder_name = BANK_ACCOUNT_HOLDER_NAME;
    const reason = options?.rejectionReason?.trim();
    if (reason) {
      updatePayload.admin_notes = reason;
    }
  }

  const { error: updateError } = await admin
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (options?.price !== undefined) {
    await admin
      .from("order_items")
      .update({ unit_price: options.price })
      .eq("order_id", orderId);
  }

  const customer = order as OrderWithCustomer;
  const approvedPrice = String(options?.price ?? customer.total_amount);

  if (nextStatus === "shipping" && options?.shippingInfo && customer.profiles?.email) {
    const locale = (customer.profiles.locale ?? "en") as Locale;
    const notif = getNotificationContent("shipping", orderId);
    await admin.from("notifications").insert({
      user_id: order.user_id,
      tenant_id: order.tenant_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      order_id: orderId,
    });
    await sendStatusEmail(customer.profiles.email, "shipping", locale, {
      name: customer.profiles.full_name ?? "Customer",
      orderId,
      total: String(order.total_amount),
      trackingNumber: options.shippingInfo.tracking_number,
      shippingCompany: options.shippingInfo.shipping_carrier,
      trackingUrl: options.shippingInfo.shipping_url,
    });
  } else if (
    nextStatus === "pending_payment" &&
    current !== "paid" &&
    current !== "payment_submitted" &&
    customer.order_type === "custom" &&
    customer.profiles?.email
  ) {
    const locale = (customer.profiles.locale ?? "en") as Locale;
    const item = customer.order_items?.[0];
    const designSize =
      item?.size ?? item?.specs?.design_size ?? "—";
    const notif = getNotificationContent("approved", orderId);

    await admin.from("notifications").insert({
      user_id: order.user_id,
      tenant_id: order.tenant_id,
      type: "custom_order_approved",
      title: notif.title,
      message: {
        en: `Custom order ${orderId} approved. Final price: ${approvedPrice} EUR. Open Custom Orders and tap Order Now to pay.`,
        ar: `تمت الموافقة على الطلب المخصص ${orderId}. السعر النهائي: ${approvedPrice} EUR. افتح طلباتك المخصصة واضغط «اطلب الآن» للدفع.`,
        tr: `Özel sipariş ${orderId} onaylandı. Nihai fiyat: ${approvedPrice} EUR. Özel Siparişler bölümünden Şimdi Sipariş Ver ile ödeme yapın.`,
      },
      order_id: orderId,
    });

    await sendCustomOrderApprovedEmail(customer.profiles.email, locale, {
      name: customer.profiles.full_name ?? "Customer",
      orderId,
      total: approvedPrice,
      quantity: String(item?.quantity ?? ""),
      designSize,
      adminNotes: options?.adminNotes,
    });
  } else if (
    (current === "paid" || current === "payment_submitted") &&
    nextStatus === "pending_payment"
  ) {
    const reason = options?.rejectionReason?.trim();
    await admin.from("notifications").insert({
      user_id: order.user_id,
      tenant_id: order.tenant_id,
      type: "payment_rejected",
      title: {
        en: "Payment not accepted",
        ar: "لم يتم قبول الدفع",
        tr: "Ödeme kabul edilmedi",
      },
      message: {
        en: reason
          ? `Payment for order ${orderId} was rejected: ${reason}. Please upload a new receipt.`
          : `Payment for order ${orderId} was rejected. Please upload a new receipt.`,
        ar: reason
          ? `تم رفض الدفع للطلب ${orderId}: ${reason}. يرجى رفع إيصال جديد.`
          : `تم رفض الدفع للطلب ${orderId}. يرجى رفع إيصال جديد.`,
        tr: reason
          ? `${orderId} siparişi ödemesi reddedildi: ${reason}. Lütfen yeni bir makbuz yükleyin.`
          : `${orderId} siparişi ödemesi reddedildi. Lütfen yeni bir makbuz yükleyin.`,
      },
      order_id: orderId,
    });
  } else {
    await notifyCustomer(admin, customer, nextStatus, orderId);
  }

  return { ok: true };
}

export async function transitionReturnStatus(
  admin: AdminClient,
  returnId: string,
  nextStatus: ReturnStatus,
  adminNotes?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: returnRecord, error: fetchError } = await admin
    .from("returns")
    .select("*, orders(id, user_id, tenant_id, total_amount)")
    .eq("id", returnId)
    .single();

  if (fetchError || !returnRecord) {
    return { ok: false, error: "Return not found" };
  }

  const current = returnRecord.status as ReturnStatus;
  const validation = validateReturnStatusUpdate(current, nextStatus);
  if (!validation.ok) {
    return validation;
  }

  const isArchived = false;

  const { error: updateError } = await admin
    .from("returns")
    .update({
      status: nextStatus,
      is_archived: isArchived,
      admin_notes: adminNotes ?? returnRecord.admin_notes,
    })
    .eq("id", returnId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const orderId = returnRecord.order_id as string;
  const order = returnRecord.orders as {
    id: string;
    user_id: string;
    tenant_id: string;
    total_amount: number;
  } | null;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, locale")
    .eq("id", returnRecord.user_id)
    .maybeSingle();

  if (nextStatus === "refunded" && order) {
    const refundDbStatus = toDbOrderStatus("refunded");
    await admin
      .from("orders")
      .update({
        status: refundDbStatus,
        is_archived: false,
      })
      .eq("id", orderId);

    if (profile?.email) {
      await sendStatusEmail(profile.email, "refunded", (profile.locale ?? "en") as Locale, {
        name: profile.full_name ?? "Customer",
        orderId,
        total: String(order.total_amount),
      });
    }

    await admin.from("notifications").insert({
      user_id: returnRecord.user_id,
      tenant_id: returnRecord.tenant_id,
      type: "return_refunded",
      title: getNotificationContent("refunded", orderId).title,
      message: getNotificationContent("refunded", orderId).message,
      order_id: orderId,
      return_id: returnId,
    });
  } else if (profile?.email && order) {
    const statusKey = nextStatus === "approved" ? "return_approved" : `return_${nextStatus}`;
    await admin.from("notifications").insert({
      user_id: returnRecord.user_id,
      tenant_id: returnRecord.tenant_id,
      type: statusKey,
      title: {
        en: `Return update — ${orderId}`,
        ar: `تحديث الإرجاع — ${orderId}`,
        tr: `İade güncellemesi — ${orderId}`,
      },
      message: {
        en: `Your return for order ${orderId} is now: ${nextStatus}.`,
        ar: `حالة إرجاع الطلب ${orderId}: ${nextStatus}.`,
        tr: `${orderId} siparişi iadesi durumu: ${nextStatus}.`,
      },
      order_id: orderId,
      return_id: returnId,
    });
  }

  return { ok: true };
}

export async function fetchAdminSectionCounts(
  admin: AdminClient,
  tenantId: string
): Promise<Record<string, number>> {
  const countOrders = async (
    orderType: string,
    statuses: string[],
    archived: boolean
  ) => {
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("order_type", orderType)
      .eq("is_archived", archived)
      .in("status", statuses);
    return count ?? 0;
  };

  const countReturns = async (statuses: string[], archived: boolean) => {
    const { count } = await admin
      .from("returns")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_archived", archived)
      .in("status", statuses);
    return count ?? 0;
  };

  return {
    newCustom: await countOrders("custom", ["pending_approval"], false),
    waitingPaymentCustom: await countOrders("custom", ["pending_payment"], false),
    approvedCustom: await countOrders(
      "custom",
      ["in_progress", "processing", "shipped"],
      false
    ),
    newStandard: await countOrders("standard", ["pending_approval"], false),
    approvedStandard: await countOrders(
      "standard",
      ["in_progress", "processing", "shipped"],
      false
    ),
    returns: await countReturns(["pending"], false),
    approvedReturns: await countReturns(["approved", "shipping", "inspecting"], false),
    history: await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "delivered")
      .then(({ count }) => count ?? 0),
  };
}

export async function submitCustomOrderPayment(
  admin: AdminClient,
  orderId: string,
  userId: string,
  receipt: { buffer: Buffer; fileName: string; contentType: string }
): Promise<
  { ok: true } | { ok: false; error: string; status: 400 | 404 | 500 }
> {
  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("*, profiles(full_name, email, locale)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !order) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  if (order.order_type !== "custom") {
    return { ok: false, error: "Not a custom order", status: 400 };
  }

  const current = normalizeOrderStatus(String(order.status));
  const canPay =
    current === "pending_payment" ||
    current === "waiting_for_payment" ||
    (current === "approved" && order.total_amount > 0 && !order.receipt_url);

  if (!canPay) {
    return { ok: false, error: "This order is not awaiting payment", status: 400 };
  }

  const upload = await uploadPaymentReceipt({
    tenantId: order.tenant_id,
    userId,
    orderId,
    fileName: receipt.fileName,
    buffer: receipt.buffer,
    contentType: receipt.contentType,
  });

  if ("error" in upload) {
    return { ok: false, error: "Failed to upload payment receipt", status: 500 };
  }

  const paymentDbStatus = toDbOrderStatus("pending_payment");

  const { error: updateError } = await admin
    .from("orders")
    .update({
      status: paymentDbStatus,
      receipt_url: upload.url,
      account_holder_name: BANK_ACCOUNT_HOLDER_NAME,
    })
    .eq("id", orderId);

  if (updateError) {
    await admin.storage.from(PAYMENT_RECEIPTS_BUCKET).remove([upload.path]);
    return { ok: false, error: updateError.message, status: 500 };
  }

  const customer = order as OrderWithCustomer;
  if (customer.profiles?.email) {
    const locale = (customer.profiles.locale ?? "en") as Locale;
    await admin.from("notifications").insert({
      user_id: order.user_id,
      tenant_id: order.tenant_id,
      type: "paid",
      title: {
        en: "Payment received",
        ar: "تم استلام الدفع",
        tr: "Ödeme alındı",
      },
      message: {
        en: `Payment proof for order ${orderId} was submitted. We will review it shortly.`,
        ar: `تم إرسال إثبات الدفع للطلب ${orderId}. سنراجعه قريباً.`,
        tr: `${orderId} siparişi için ödeme kanıtı gönderildi. Kısa sürede inceleyeceğiz.`,
      },
      order_id: orderId,
    });
    await sendStatusEmail(customer.profiles.email, "paid", locale, {
      name: customer.profiles.full_name ?? "Customer",
      orderId,
      total: String(order.total_amount),
    });
  }

  await notifyTenantAdmins(admin, order.tenant_id, {
    type: "payment_submitted_admin",
    title: {
      en: "Payment receipt submitted",
      ar: "تم إرسال إيصال الدفع",
      tr: "Ödeme makbuzu gönderildi",
    },
    message: {
      en: `Customer submitted payment proof for custom order ${orderId}. Review and accept or reject the payment.`,
      ar: `أرسل العميل إثبات الدفع للطلب المخصص ${orderId}. راجع الدفع واقبله أو ارفضه.`,
      tr: `Müşteri ${orderId} özel siparişi için ödeme kanıtı gönderdi. Ödemeyi inceleyip onaylayın veya reddedin.`,
    },
    order_id: orderId,
  });

  return { ok: true };
}
