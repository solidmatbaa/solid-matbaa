import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { fetchAdminSectionCounts } from "@/lib/order-service";
import {
  expandStatusesForQuery,
  normalizeOrderStatus,
  sectionFilters,
  type AdminOrderSection,
} from "@/lib/order-transitions";
import { FULFILLMENT_PIPELINE_STATUSES } from "@/lib/orders";
import type { ApiResponse } from "@/types";
import { attachLineItemsToOrders, normalizeAdminOrder } from "@/lib/order-items";
import {
  belongsInAdminApprovedOrders,
  belongsInAdminNewOrders,
  isCustomAwaitingApproval,
} from "@/lib/orders";

/** Nested embed + customer profile; order_items also batch-loaded as fallback. */
const ORDER_SELECT = "*, order_items(*), profiles(full_name, email, phone, address)";

/** Admin dashboard order tabs — strict status filters. */
const ADMIN_ORDER_TABS = ["new", "approved", "archive"] as const;
type AdminOrderTab = (typeof ADMIN_ORDER_TABS)[number];

const VALID_SECTIONS = new Set<string>([
  ...ADMIN_ORDER_TABS,
  "newCustom",
  "approvedCustom",
  "newStandard",
  "approvedStandard",
  "history",
  "returns",
  "approvedReturns",
  "all",
]);

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json<ApiResponse<null>>({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id, username")
    .eq("id", user.id)
    .single();

  if (!isAdmin(profile)) {
    return { error: NextResponse.json<ApiResponse<null>>({ success: false, error: "Forbidden" }, { status: 403 }) };
  }

  return { profile: profile!, supabase };
}

function normalizeOrderRow<T extends { status?: string }>(order: T): T {
  if (!order.status) return order;
  return { ...order, status: normalizeOrderStatus(order.status) };
}

async function buildOrdersPayload(
  admin: ReturnType<typeof createAdminClient>,
  orders: Array<Record<string, unknown>> | null
) {
  const normalized = (orders ?? []).map((order) =>
    normalizeOrderRow(order as { status?: string })
  );
  const withItems = await attachLineItemsToOrders(admin, normalized);
  return withItems.map((order) => normalizeAdminOrder(order));
}

function isAdminOrderTab(section: string): section is AdminOrderTab {
  return (ADMIN_ORDER_TABS as readonly string[]).includes(section);
}

async function fetchOrdersForAdminTab(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  tab: AdminOrderTab
) {
  if (tab === "new") {
    const [approvalRes, paymentReviewRes] = await Promise.all([
      admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("tenant_id", tenantId)
        .eq("is_archived", false)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false }),
      admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("tenant_id", tenantId)
        .eq("is_archived", false)
        .eq("order_type", "custom")
        .in("status", ["paid", "payment_submitted"])
        .not("receipt_url", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    if (approvalRes.error) {
      return { error: approvalRes.error.message, data: null as null };
    }
    if (paymentReviewRes.error) {
      return { error: paymentReviewRes.error.message, data: null as null };
    }

    const merged = [...(approvalRes.data ?? []), ...(paymentReviewRes.data ?? [])].sort(
      (a, b) =>
        new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()
    );

    const orders = merged.filter((order) =>
      belongsInAdminNewOrders({
        order_type: String(order.order_type),
        status: normalizeOrderStatus(String(order.status)),
        receipt_url: order.receipt_url as string | null | undefined,
      })
    );

    return { error: null, data: await buildOrdersPayload(admin, orders) };
  }

  let query = admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("tenant_id", tenantId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (tab === "approved") {
    query = query.in("status", expandStatusesForQuery(FULFILLMENT_PIPELINE_STATUSES));
  } else {
    return { error: null, data: [] };
  }

  const { data: ordersRaw, error } = await query;

  if (error) {
    console.error(`[admin/orders] ${tab} query failed:`, error.message);
    return { error: error.message, data: null as null };
  }

  let orders = ordersRaw ?? [];

  orders = orders.filter((order) => {
    const normalized = {
      order_type: String(order.order_type),
      status: normalizeOrderStatus(String(order.status)),
      receipt_url: order.receipt_url as string | null | undefined,
    };
    if (tab === "approved") return belongsInAdminApprovedOrders(normalized);
    return normalizeOrderStatus(String(order.status)) === "delivered";
  });

  return { error: null, data: await buildOrdersPayload(admin, orders) };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const tenantId = auth.profile.tenant_id;

    if (!tenantId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Tenant not configured" },
        { status: 400 }
      );
    }

    if (searchParams.get("counts") === "true") {
      const admin = createAdminClient();
      const counts = await fetchAdminSectionCounts(admin, tenantId);
      return NextResponse.json({ success: true, data: counts });
    }

    const sectionParam = searchParams.get("section") ?? "new";
    if (!VALID_SECTIONS.has(sectionParam)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid section" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (isAdminOrderTab(sectionParam)) {
      const result = await fetchOrdersForAdminTab(admin, tenantId, sectionParam);
      if (result.error) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    const section = sectionParam as AdminOrderSection;
    const filters = sectionFilters(section);

    if (filters.kind === "returns" || section === "returns" || section === "approvedReturns") {
      let query = admin
        .from("returns")
        .select("*, orders(id, total_amount, status, order_type)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (filters.archived !== undefined) {
        query = query.eq("is_archived", filters.archived);
      }
      if (filters.returnStatuses) {
        query = query.in("status", filters.returnStatuses);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: data ?? [] });
    }

    if (filters.kind === "history") {
      const orderId = searchParams.get("orderId");

      if (orderId) {
        const { data: order, error } = await admin
          .from("orders")
          .select(ORDER_SELECT)
          .eq("tenant_id", tenantId)
          .eq("id", orderId)
          .eq("status", "delivered")
          .maybeSingle();

        if (error || !order) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Order not found in archive" },
            { status: 404 }
          );
        }

        const [payload] = await buildOrdersPayload(admin, [order]);
        return NextResponse.json({ success: true, data: [payload] });
      }

      return NextResponse.json({ success: true, data: [] });
    }

    let query = admin
      .from("orders")
      .select(ORDER_SELECT)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filters.orderType) {
      query = query.eq("order_type", filters.orderType);
    }
    if (filters.archived !== undefined) {
      query = query.eq("is_archived", filters.archived);
    }
    if (filters.orderStatuses) {
      if (filters.orderStatuses.length === 1) {
        query = query.eq("status", filters.orderStatuses[0]!);
      } else {
        query = query.in("status", filters.orderStatuses);
      }
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("[admin/orders] orders query failed:", error.message);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    let orderRows = orders ?? [];
    if (section === "newCustom") {
      orderRows = orderRows.filter((order) =>
        isCustomAwaitingApproval({
          order_type: String(order.order_type),
          status: normalizeOrderStatus(String(order.status)),
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: await buildOrdersPayload(admin, orderRows),
    });
  } catch (err) {
    console.error("[admin/orders] unhandled error:", err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
