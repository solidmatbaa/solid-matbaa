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
import type { ApiResponse } from "@/types";
import { attachLineItemsToOrders, normalizeAdminOrder } from "@/lib/order-items";
import { isCustomAwaitingApproval, isCustomPaid } from "@/lib/orders";

/** Nested embed + customer profile; order_items also batch-loaded as fallback. */
const ORDER_SELECT = "*, order_items(*), profiles(full_name, email, phone, address)";

const VALID_SECTIONS = new Set<string>([
  "newCustom",
  "approvedCustom",
  "newStandard",
  "approvedStandard",
  "history",
  "returns",
  "approvedReturns",
  "new",
  "approved",
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

function mapLegacySection(section: string): AdminOrderSection | "history" | "allPending" | "allApproved" {
  if (section === "new") return "allPending";
  if (section === "approved") return "allApproved";
  if (section === "all") return "allPending";
  return section as AdminOrderSection;
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

    const sectionParam = searchParams.get("section") ?? "newStandard";
    if (!VALID_SECTIONS.has(sectionParam)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid section" },
        { status: 400 }
      );
    }

    const section = mapLegacySection(sectionParam);
    const admin = createAdminClient();

    if (section === "allPending" || section === "allApproved") {
      const orderStatuses =
        section === "allPending"
          ? (["pending", "pending_approval"] as const)
          : (["approved", "paid", "processing", "shipping"] as const);

      const { data: ordersRaw, error } = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("tenant_id", tenantId)
        .eq("is_archived", false)
        .in("status", expandStatusesForQuery([...orderStatuses]))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[admin/orders] orders query failed:", error.message);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      let orders = ordersRaw ?? [];
      if (section === "allPending") {
        orders = orders.filter((order) => {
          const status = normalizeOrderStatus(String(order.status));
          const type = String(order.order_type);
          return (
            (type === "custom" &&
              (isCustomAwaitingApproval({ order_type: type, status }) ||
                status === "pending")) ||
            (type === "standard" && status === "pending")
          );
        });
      } else {
        orders = orders.filter((order) => {
          const status = normalizeOrderStatus(String(order.status));
          const type = String(order.order_type);
          if (type === "standard") {
            return ["approved", "processing", "shipping"].includes(status);
          }
          if (type === "custom") {
            return isCustomPaid({ order_type: type, status }) || ["processing", "shipping"].includes(status);
          }
          return false;
        });
      }

      return NextResponse.json({
        success: true,
        data: await buildOrdersPayload(admin, orders),
      });
    }

    const filters = sectionFilters(section as AdminOrderSection);

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
          .eq("is_archived", true)
          .maybeSingle();

        if (error || !order) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Order not found in history" },
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
      query = query.in("status", expandStatusesForQuery(filters.orderStatuses));
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
