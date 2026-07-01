import { normalizeOrderStatus } from "@/lib/order-transitions";
import type { Order, OrderStatus, OrderTab, Return, ReturnStatus } from "@/types";

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "pending_approval",
  "approved",
  "waiting_for_payment",
  "payment_submitted",
  "processing",
  "shipping",
];

const TERMINAL_RETURN_STATUSES: ReturnStatus[] = ["rejected", "refunded"];

function getOpenReturn(orderId: string, returns: Return[]): Return | undefined {
  return returns.find(
    (r) => r.order_id === orderId && r.status !== "rejected"
  );
}

/** Refund request awaiting admin approve/reject — order stays in Order History. */
export function getPendingReturnForOrder(
  orderId: string,
  returns: Return[]
): Return | undefined {
  return returns.find(
    (r) => r.order_id === orderId && r.status === "pending"
  );
}

export function orderHasActiveReturn(orderId: string, returns: Return[]): boolean {
  return returns.some(
    (r) =>
      r.order_id === orderId &&
      !TERMINAL_RETURN_STATUSES.includes(r.status)
  );
}

/** In-progress refund (approved through inspecting) — shown in Returns tab. */
export function getReturnForOrder(orderId: string, returns: Return[]): Return | undefined {
  return returns.find(
    (r) =>
      r.order_id === orderId &&
      !TERMINAL_RETURN_STATUSES.includes(r.status)
  );
}

export function filterOrdersByTab(
  orders: Order[],
  tab: OrderTab,
  returns: Return[] = []
): Order[] {
  switch (tab) {
    case "custom":
      return orders.filter(
        (o) =>
          o.order_type === "custom" &&
          !o.is_archived &&
          ACTIVE_STATUSES.includes(o.status)
      );
    case "active":
      return orders.filter(
        (o) =>
          o.order_type === "standard" &&
          !o.is_archived &&
          ACTIVE_STATUSES.includes(o.status)
      );
    case "history":
      return orders.filter((o) => {
        if (o.status === "refunded") return false;

        const openReturn = getOpenReturn(o.id, returns);
        // Keep in history while refund is pending; once admin acts, show in Returns tab
        if (openReturn && openReturn.status !== "pending") return false;

        return (
          o.status === "delivered" ||
          (o.is_archived && o.status !== "rejected")
        );
      });
    default:
      return [];
  }
}

/** Customer Returns tab — all refund requests, including completed refunds. */
export function filterReturnsByTab(
  returns: Return[],
  tab: OrderTab
): Return[] {
  if (tab !== "returns") return [];
  return returns;
}

export function getActiveOrders(orders: Order[]): Order[] {
  return orders.filter(
    (o) => !o.is_archived && ACTIVE_STATUSES.includes(o.status)
  );
}

export function getPendingReturns(returns: Return[]): Return[] {
  return returns.filter((r) => r.status === "pending");
}

export async function generateOrderId(
  supabase: { rpc: (fn: string) => Promise<{ data: string | null; error: unknown }> }
): Promise<string> {
  const { data, error } = await supabase.rpc("generate_order_id");
  if (error || !data) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `SM-${date}-${rand}`;
  }
  return data;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "pending_approval",
  "approved",
  "waiting_for_payment",
  "payment_submitted",
  "processing",
  "shipping",
  "delivered",
];

export const RETURN_STATUS_FLOW: ReturnStatus[] = [
  "pending",
  "approved",
  "shipping",
  "inspecting",
  "refunded",
];

export function getNextStatuses(current: OrderStatus | string): OrderStatus[] {
  const normalized = normalizeOrderStatus(String(current));
  if (normalized === "payment_submitted") return ["processing"];
  if (normalized === "waiting_for_payment") return [];
  const idx = ORDER_STATUS_FLOW.indexOf(normalized);
  if (idx === -1) return [];
  return ORDER_STATUS_FLOW.slice(idx + 1).filter(
    (status) => status !== "waiting_for_payment" && status !== "payment_submitted"
  );
}

export function getNextReturnStatuses(current: ReturnStatus): ReturnStatus[] {
  const idx = RETURN_STATUS_FLOW.indexOf(current);
  if (idx === -1) return [];
  return RETURN_STATUS_FLOW.slice(idx + 1);
}

export function getReturnActionLabel(status: ReturnStatus): string {
  switch (status) {
    case "shipping":
      return "markReceivedByCarrier";
    case "inspecting":
      return "markInspecting";
    case "refunded":
      return "markRefunded";
    default:
      return "updateStatus";
  }
}
