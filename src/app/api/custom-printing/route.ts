import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCustomQuantity } from "@/lib/custom-order";
import { ORDER_DESIGNS_BUCKET } from "@/lib/order-files";
import { buildCustomOrderInsert } from "@/lib/order-insert";
import { resolveStorageObjectPath } from "@/lib/storage-access";
import type { ApiResponse } from "@/types";

const customPrintingBodySchema = z.object({
  designFileUrl: z.string().min(1),
  quantity: z.coerce.number().int(),
  designSize: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Please log in to submit a quote request" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email_verified, tenant_id, full_name, email, phone, address")
      .eq("id", user.id)
      .single();

    if (!profile?.email_verified) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Please verify your email before submitting" },
        { status: 403 }
      );
    }

    if (!profile.tenant_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Profile not configured" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = customPrintingBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }

    const { designFileUrl, designSize } = parsed.data;
    const qtyValidation = validateCustomQuantity(parsed.data.quantity);
    if (!qtyValidation.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: qtyValidation.error },
        { status: 400 }
      );
    }

    const qty = parsed.data.quantity;
    const objectPath = resolveStorageObjectPath(ORDER_DESIGNS_BUCKET, designFileUrl);
    const expectedPrefix = `${profile.tenant_id}/${user.id}/`;

    if (!objectPath?.startsWith(expectedPrefix)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid design file URL" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: orderId } = await admin.rpc("generate_order_id");

    const orderIdStr = (orderId as string) ?? `SM-${Date.now()}`;

    const orderInsert = buildCustomOrderInsert({
      orderId: orderIdStr,
      tenantId: profile.tenant_id,
      userId: user.id,
      notes: `Custom print quote — Qty: ${qty}, Size: ${designSize}`,
      designFileUrl: objectPath,
    });

    const { error: orderError } = await admin.from("orders").insert(orderInsert);

    if (orderError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: orderError.message },
        { status: 500 }
      );
    }

    const { error: itemError } = await admin.from("order_items").insert({
      order_id: orderIdStr,
      product_name: {
        en: "Custom Print Quote",
        ar: "طلب طباعة مخصصة",
        tr: "Özel Baskı Teklifi",
      },
      quantity: qty,
      unit_price: 0,
      size: designSize,
      specs: { type: "custom_print", design_size: designSize },
    });

    if (itemError) {
      await admin.from("orders").delete().eq("id", orderIdStr);
      await admin.storage.from(ORDER_DESIGNS_BUCKET).remove([objectPath]);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: itemError.message },
        { status: 500 }
      );
    }

    await admin.from("notifications").insert({
      user_id: user.id,
      tenant_id: profile.tenant_id,
      type: "custom_quote_submitted",
      title: {
        en: "Custom quote submitted",
        ar: "تم إرسال طلب السعر المخصص",
        tr: "Özel fiyat teklifi gönderildi",
      },
      message: {
        en: `Your custom order ${orderIdStr} is pending admin review.`,
        ar: `طلبك المخصص ${orderIdStr} قيد مراجعة الإدارة.`,
        tr: `Özel siparişiniz ${orderIdStr} yönetici incelemesinde.`,
      },
      order_id: orderIdStr,
    });

    return NextResponse.json({
      success: true,
      data: { orderId: orderIdStr, message: "Quote request submitted successfully" },
    });
  } catch (err) {
    console.error("Custom printing error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
