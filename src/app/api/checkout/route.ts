import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCheckoutOrderItemRows,
  insertOrderLineItems,
} from "@/lib/order-items";
import {
  mapUserAddressToShippingAddress,
  validateUserAddress,
} from "@/lib/address-data";
import { isPaymentReceiptMimeType } from "@/lib/payment-receipts-storage";
import { uploadPaymentReceipt } from "@/lib/storage";
import { buildStandardOrderInsert, stripPaymentIbanFromPayload } from "@/lib/payment-details";
import { jsonApiError, jsonApiResponse } from "@/lib/api-response";
import { resolveProductImageUrl, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/utils";
import type { CartItem, UserAddress } from "@/types";

const localizedNameSchema = z
  .object({
    en: z.string().optional(),
    ar: z.string().optional(),
    tr: z.string().optional(),
  })
  .strip();

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  productName: localizedNameSchema,
  price: z.number().nonnegative(),
  tierQuantity: z.number().positive(),
  quantity: z.number().int().min(1),
  imageUrl: z.string().nullable().optional(),
});

const userAddressSchema = z
  .object({
    country: z.string().min(1),
    state: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    region: z.string().optional(),
    street: z.string().min(1),
    building_number: z.string().min(1),
    apartment_number: z.string().min(1),
    postal_code: z.string().optional(),
    additional_details: z.string().optional(),
    province: z.string().optional(),
    neighborhood: z.string().optional(),
  })
  .strip();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, full_name, email, locale, phone, address, email_verified")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return jsonApiResponse({ success: false, error: "Profile not configured" }, 400);
    }

    if (!profile.email_verified) {
      return jsonApiResponse({ success: false, error: "Please verify your email first" }, 403);
    }

    const formData = await request.formData();
    // payment_iban is display-only on the client; ignore if sent as a form field.
    formData.delete("payment_iban");
    formData.delete("paymentIban");

    const receipt = formData.get("receipt") as File | null;
    const itemsRaw = formData.get("items") as string | null;
    const addressRaw = formData.get("address") as string | null;

    if (!receipt || !itemsRaw || !addressRaw) {
      return jsonApiResponse(
        { success: false, error: "Receipt, cart items, and shipping address are required" },
        400
      );
    }

    let itemsParsed: unknown;
    try {
      itemsParsed = JSON.parse(itemsRaw);
    } catch {
      return jsonApiResponse({ success: false, error: "Invalid cart items" }, 400);
    }

    if (Array.isArray(itemsParsed)) {
      itemsParsed = itemsParsed.map((item) =>
        typeof item === "object" && item !== null
          ? stripPaymentIbanFromPayload(item as Record<string, unknown>)
          : item
      );
    }

    const parsed = z.array(cartItemSchema).min(1).safeParse(itemsParsed);
    if (!parsed.success) {
      return jsonApiResponse({ success: false, error: "Invalid cart items" }, 400);
    }

    const items = parsed.data as CartItem[];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let addressParsed: UserAddress;
    try {
      const addressJson = JSON.parse(addressRaw);
      const sanitizedAddress =
        typeof addressJson === "object" && addressJson !== null
          ? stripPaymentIbanFromPayload(addressJson as Record<string, unknown>)
          : addressJson;
      const addressResult = userAddressSchema.safeParse(sanitizedAddress);
      if (!addressResult.success) {
        return jsonApiResponse({ success: false, error: "Invalid shipping address" }, 400);
      }
      addressParsed = addressResult.data as UserAddress;
    } catch {
      return jsonApiResponse({ success: false, error: "Invalid shipping address" }, 400);
    }

    const addressError = validateUserAddress(addressParsed);
    if (addressError) {
      return jsonApiResponse({ success: false, error: addressError }, 400);
    }

    const receiptContentType = receipt.type || "application/octet-stream";
    if (!isPaymentReceiptMimeType(receiptContentType)) {
      return jsonApiResponse(
        { success: false, error: "Invalid file type. Use JPG, PNG, or PDF." },
        400
      );
    }

    const admin = createAdminClient();
    const { data: orderIdResult } = await admin.rpc("generate_order_id");
    const orderId =
      orderIdResult ??
      `SM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const receiptBuffer = Buffer.from(await receipt.arrayBuffer());
    const receiptUpload = await uploadPaymentReceipt({
      tenantId: profile.tenant_id,
      userId: user.id,
      orderId,
      fileName: receipt.name,
      buffer: receiptBuffer,
      contentType: receiptContentType,
    });

    if ("error" in receiptUpload) {
      return jsonApiResponse({ success: false, error: receiptUpload.error }, 500);
    }

    const shippingAddress = mapUserAddressToShippingAddress(
      addressParsed,
      profile.full_name ?? "",
      profile.phone ?? ""
    );

    await supabase
      .from("profiles")
      .update({ address: addressParsed })
      .eq("id", user.id);

    const orderInsert = buildStandardOrderInsert({
      orderId,
      tenantId: profile.tenant_id,
      userId: user.id,
      shippingAddress,
      total,
      receiptUrl: receiptUpload.url,
    });

    const { error: orderError } = await admin.from("orders").insert(orderInsert);

    if (orderError) {
      return jsonApiResponse({ success: false, error: orderError.message }, 500);
    }

    const orderItems = await buildCheckoutOrderItemRows(
      admin,
      orderId,
      items,
      (url) => {
        const resolved = resolveProductImageUrl(url);
        return resolved === PRODUCT_IMAGE_PLACEHOLDER ? null : resolved;
      }
    );

    const { error: itemsError } = await insertOrderLineItems(admin, orderItems, {
      rollbackOrderId: orderId,
    });

    if (itemsError) {
      return jsonApiResponse(
        { success: false, error: `Failed to save order items: ${itemsError}` },
        500
      );
    }

    const { getNotificationContent, sendStatusEmail } = await import("@/lib/email");
    const notifContent = getNotificationContent("pending", orderId);

    await admin.from("notifications").insert({
      user_id: user.id,
      tenant_id: profile.tenant_id,
      type: notifContent.type,
      title: notifContent.title,
      message: notifContent.message,
      order_id: orderId,
    });

    if (profile.email) {
      await sendStatusEmail(profile.email, "pending", profile.locale ?? "en", {
        name: profile.full_name ?? "Customer",
        orderId,
        total: String(total),
      });
    }

    return jsonApiResponse({ success: true, data: { orderId } });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonApiError(message, 500);
  }
}
