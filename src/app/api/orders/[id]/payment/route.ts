import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaymentReceiptMimeType } from "@/lib/payment-receipts-storage";
import { submitCustomOrderPayment } from "@/lib/order-service";
import type { ApiResponse } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const receipt = formData.get("receipt") as File | null;

    if (!receipt) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Payment receipt is required" },
        { status: 400 }
      );
    }

    const contentType = receipt.type || "application/octet-stream";
    if (!isPaymentReceiptMimeType(contentType)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid file type. Use JPG, PNG, or PDF." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await receipt.arrayBuffer());
    const admin = createAdminClient();

    const result = await submitCustomOrderPayment(admin, orderId, user.id, {
      buffer,
      fileName: receipt.name,
      contentType,
    });

    if (!result.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: { orderId, status: "pending_payment" as const },
    });
  } catch (err) {
    console.error("Custom order payment error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
