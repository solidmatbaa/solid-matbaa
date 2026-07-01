import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transitionOrderStatus } from "@/lib/order-service";
import {
  extractOrderStatusString,
  normalizeOrderStatus,
  ORDER_STATUSES,
  parseOrderStatusInput,
} from "@/lib/order-transitions";
import { normalizeShippingInput } from "@/lib/shipping";
import type { ApiResponse, OrderStatus, ShippingInfo } from "@/types";

const shippingInfoSchema = z
  .object({
    tracking_number: z.string().min(1),
    shipping_carrier: z.string().min(1).optional(),
    shipping_url: z.string().url().optional(),
    shipping_company: z.string().min(1).optional(),
    tracking_url: z.string().url().optional(),
  })
  .transform((value, ctx): ShippingInfo => {
    const normalized = normalizeShippingInput(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tracking number, carrier, and tracking URL are required",
      });
      return z.NEVER;
    }
    return normalized;
  });

const updateStatusSchema = z
  .object({
    orderId: z.preprocess(
      (value) =>
        typeof value === "string"
          ? value.trim()
          : extractOrderStatusString(value),
      z.string().min(1)
    ),
    status: z.preprocess(
      (value) => extractOrderStatusString(value),
      z.enum(ORDER_STATUSES)
    ),
    shippingInfo: shippingInfoSchema.optional(),
    rejectionReason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const parsed = parseOrderStatusInput(data.status);
    if (!parsed.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: parsed.error,
      });
    }
  });

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const statusParsed = parseOrderStatusInput(parsed.data.status);
    if (!statusParsed.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: statusParsed.error },
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
    const { orderId, shippingInfo, rejectionReason } = parsed.data;
    const status: OrderStatus = statusParsed.app;

    const result = await transitionOrderStatus(admin, orderId, status, {
      shippingInfo,
      rejectionReason,
    });

    if (!result.ok) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { orderId, status, deleted: result.deleted ?? false },
    });
  } catch (err) {
    console.error("Update order status error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId");

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

    if (orderId) {
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
      const { data: order, error } = await admin
        .from("orders")
        .select("*, order_items(*), profiles(full_name, email, phone, address)")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Order not found in archive" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: order });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .eq("hidden_from_client", false)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const normalizedOrders = (orders ?? []).map((order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
    }));

    return NextResponse.json({ success: true, data: normalizedOrders });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
    if (!orderId) {
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

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (normalizeOrderStatus(order.status) !== "rejected") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Only rejected orders can be removed from your list" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("orders")
      .update({
        hidden_from_client: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { orderId } });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
