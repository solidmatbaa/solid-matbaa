import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/order-service";
import { normalizeOrderStatus } from "@/lib/order-transitions";
import type { ApiResponse, OrderStatus } from "@/types";

const approveBodySchema = z.object({
  price: z.number().positive().optional(),
  adminNotes: z.string().max(2000).optional(),
});

/**
 * Auth: session client from @/lib/supabase/server (reads admin cookies).
 * Mutations: service-role client from @/lib/supabase/admin (bypasses RLS for order updates).
 */
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

    let body: unknown = {};
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    }

    const parsedBody = approveBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsedBody.error.errors[0]?.message ?? "Invalid request body" },
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
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();

    if (!isAdmin(profile)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const { data: orderBefore, error: beforeError } = await admin
      .from("orders")
      .select("id, status, tenant_id, order_type")
      .eq("id", orderId)
      .maybeSingle();

    if (beforeError || !orderBefore) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (profile?.tenant_id && orderBefore.tenant_id !== profile.tenant_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const normalized = normalizeOrderStatus(String(orderBefore.status));
    if (
      orderBefore.order_type === "custom" &&
      normalized !== "pending_approval" &&
      normalized !== "pending"
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Only quote requests awaiting approval can be approved" },
        { status: 400 }
      );
    }

    if (orderBefore.order_type === "standard" && normalized !== "pending") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Only pending orders can be approved" },
        { status: 400 }
      );
    }

    const { price, adminNotes } = parsedBody.data;

    if (orderBefore.order_type === "custom" && (price === undefined || price <= 0)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Price is required when approving custom orders" },
        { status: 400 }
      );
    }

    const targetStatus: OrderStatus =
      orderBefore.order_type === "custom" ? "waiting_for_payment" : "approved";

    const result = await transitionOrderStatus(admin, orderId, targetStatus, {
      price,
      adminNotes,
    });

    const { data: orderAfter } = await admin
      .from("orders")
      .select("id, status, total_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (!result.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: (orderAfter?.status ?? targetStatus) as OrderStatus,
        total_amount: orderAfter?.total_amount ?? price ?? 0,
      },
    });
  } catch (err) {
    console.error("[approve] Unhandled error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
