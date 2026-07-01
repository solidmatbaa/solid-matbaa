import { normalizeOrderStatus } from "@/lib/order-transitions";
import type { Order, OrderStatus, OrderTab, Return, ReturnStatus } from "@/types";

/** Custom quote awaiting admin price approval. */
export function isCustomAwaitingApproval(order: {
  order_type: string;
  status: string;
}): boolean {
  return (
    order.order_type === "custom" &&
    normalizeOrderStatus(order.status) === "pending_approval"
  );
}

/** Any order awaiting admin approval (quote review). */
export function isOrderPendingApproval(order: { status: string }): boolean {
  return normalizeOrderStatus(order.status) === "pending_approval";
}

/** Custom order with payment receipt uploaded — awaiting admin review in New Orders. */
export function isCustomPaymentAwaitingReview(order: {
  order_type: string;
  status: string;
  receipt_url?: string | null;
}): boolean {
  if (order.order_type !== "custom") return false;
  const status = normalizeOrderStatus(order.status);
  return status === "pending_payment" && !!order.receipt_url;
}

/** Pre-made design order awaiting admin approval. */
export function isStandardAwaitingApproval(order: {
  order_type: string;
  status: string;
}): boolean {
  if (order.order_type !== "standard") return false;
  const status = normalizeOrderStatus(order.status);
  return status === "pending_approval" || status === "pending";
}

/** Orders shown in the admin New Orders tab. */
export function belongsInAdminNewOrders(order: {
  order_type: string;
  status: string;
  receipt_url?: string | null;
}): boolean {
  const status = normalizeOrderStatus(order.status);
  if (status === "pending_approval") return true;
  if (status === "pending" && order.order_type === "standard") return true;
  return isCustomPaymentAwaitingReview(order);
}

/** Active fulfillment statuses shown in the admin Approved Orders tab. */
export const FULFILLMENT_PIPELINE_STATUSES: OrderStatus[] = [
  "in_progress",
  "processing",
  "shipping",
];

/** Orders shown in the admin Approved Orders tab (both pre-made and custom after payment). */
export function belongsInAdminApprovedOrders(order: { status: string }): boolean {
  return FULFILLMENT_PIPELINE_STATUSES.includes(normalizeOrderStatus(order.status));
}

/** Custom order awaiting customer bank transfer. */
export function isCustomPendingPayment(order: {
  order_type: string;
  status: string;
  total_amount: number;
}): boolean {
  if (order.order_type !== "custom") return false;
  const status = normalizeOrderStatus(order.status);
  return (
    (status === "pending_payment" || status === "waiting_for_payment") &&
    order.total_amount > 0
  );
}

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "pending_approval",
  "pending_payment",
  "paid",
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
  "pending_payment",
  "paid",
  "approved",
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

/** Sequential next status for the admin Approved Orders fulfillment dropdown. */
export function getApprovedTabNextStatuses(current: OrderStatus | string): OrderStatus[] {
  const normalized = normalizeOrderStatus(String(current));
  if (normalized === "in_progress") return ["processing"];
  if (normalized === "processing") return ["shipping"];
  if (normalized === "shipping") return ["delivered"];
  return [];
}

export function getNextStatuses(current: OrderStatus | string): OrderStatus[] {
  const normalized = normalizeOrderStatus(String(current));
  if (normalized === "paid" || normalized === "payment_submitted") return ["processing"];
  if (normalized === "pending_payment" || normalized === "waiting_for_payment") return [];
  const idx = ORDER_STATUS_FLOW.indexOf(normalized);
  if (idx === -1) return [];
  return ORDER_STATUS_FLOW.slice(idx + 1).filter(
    (status) =>
      status !== "pending_payment" &&
      status !== "paid" &&
      status !== "waiting_for_payment" &&
      status !== "payment_submitted"
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
