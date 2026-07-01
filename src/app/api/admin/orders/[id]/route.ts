import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types";

const updatePaymentDetailsSchema = z.object({
  paymentIban: z.string().trim().min(1).max(64),
});

export async function PATCH(
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

    const body = await request.json().catch(() => null);
    const parsed = updatePaymentDetailsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({ payment_iban: parsed.data.paymentIban })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        payment_iban: parsed.data.paymentIban,
      },
    });
  } catch (err) {
    console.error("Update order payment details error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
