import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCustomQuantity } from "@/lib/custom-order";
import { uploadOrderDesignPdf } from "@/lib/storage";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const quantity = formData.get("quantity") as string | null;
    const designSize = (formData.get("designSize") as string | null)?.trim();

    if (!file || !quantity || !designSize) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "PDF file, design size, and quantity are required" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    const qtyValidation = validateCustomQuantity(qty);
    if (!qtyValidation.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: qtyValidation.error },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadOrderDesignPdf({
      tenantId: profile.tenant_id,
      userId: user.id,
      fileName: file.name,
      buffer,
    });

    if ("error" in upload) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to upload design file. Please try again." },
        { status: 500 }
      );
    }

    const admin = createAdminClient();
    const { data: orderId } = await admin.rpc("generate_order_id");

    const orderIdStr = orderId as string ?? `SM-${Date.now()}`;

    const { error: orderError } = await admin.from("orders").insert({
      id: orderIdStr,
      tenant_id: profile.tenant_id,
      user_id: user.id,
      status: "pending",
      order_type: "custom",
      total_amount: 0,
      notes: `Custom print quote — Qty: ${qty}, Size: ${designSize}`,
      design_file_url: upload.url,
      file_url: upload.url,
    });

    if (orderError) {
      await admin.storage.from("order-designs").remove([upload.path]);
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
      await admin.storage.from("order-designs").remove([upload.path]);
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
