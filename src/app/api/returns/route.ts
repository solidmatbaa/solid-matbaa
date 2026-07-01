import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transitionReturnStatus } from "@/lib/order-service";
import type { ApiResponse } from "@/types";

const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(5),
});

const updateReturnSchema = z.object({
  returnId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "shipping", "inspecting", "refunded"]),
  adminNotes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = createReturnSchema.safeParse(body);
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
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const { orderId, reason } = parsed.data;

    const { data: order } = await supabase
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!order) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Only delivered orders can be returned" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: existingReturns } = await admin
      .from("returns")
      .select("id, status")
      .eq("order_id", orderId)
      .eq("is_archived", false);

    const hasActiveReturn = existingReturns?.some(
      (r) => r.status !== "rejected" && r.status !== "refunded"
    );

    if (hasActiveReturn) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "A refund request is already in progress for this order" },
        { status: 409 }
      );
    }

    const { data: returnRecord, error } = await admin
      .from("returns")
      .insert({
        order_id: orderId,
        user_id: user.id,
        tenant_id: profile?.tenant_id,
        reason,
        status: "pending",
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await admin.from("notifications").insert({
      user_id: user.id,
      tenant_id: profile?.tenant_id,
      type: "return_requested",
      title: {
        en: "Return Requested",
        ar: "طلب إرجاع",
        tr: "İade Talebi",
      },
      message: {
        en: `Return requested for order ${orderId}.`,
        ar: `تم طلب إرجاع للطلب ${orderId}.`,
        tr: `${orderId} için iade talep edildi.`,
      },
      order_id: orderId,
      return_id: returnRecord.id,
    });

    return NextResponse.json({ success: true, data: returnRecord });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = updateReturnSchema.safeParse(body);
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
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { returnId, status, adminNotes } = parsed.data;

    const result = await transitionReturnStatus(admin, returnId, status, adminNotes);

    if (!result.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { returnId, status } });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const section = request.nextUrl.searchParams.get("section");

    let query = supabase
      .from("returns")
      .select(
        "*, orders(id, total_amount, status, order_type, tracking_number, shipping_carrier, shipping_url, shipping_info)"
      )
      .order("created_at", { ascending: false });

    if (profile?.role !== "admin") {
      query = query.eq("user_id", user.id);
    } else if (profile.tenant_id) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    if (section === "returns") {
      query = query.eq("status", "pending");
    } else if (section === "approvedReturns") {
      query = query.in("status", ["approved", "shipping", "inspecting"]);
    } else if (section === "completedReturns") {
      query = query.in("status", ["refunded", "rejected"]);
    } else if (profile?.role !== "admin") {
      // Customer: all refund records, including completed refunds
    } else {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
