import type { OrderStatus, OrderType, ReturnStatus, ShippingInfo } from "@/types";

/** Admin dashboard sections */
export type AdminOrderSection =
  | "newCustom"
  | "approvedCustom"
  | "newStandard"
  | "approvedStandard"
  | "history"
  | "returns"
  | "approvedReturns";

export const ORDER_STATUSES = [
  "pending",
  "approved",
  "waiting_for_payment",
  "payment_submitted",
  "processing",
  "shipping",
  "delivered",
  "refunded",
  "rejected",
] as const satisfies readonly OrderStatus[];

/** Values allowed by the Supabase `orders_status_check` constraint. */
export const DB_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "refund_processed",
  "cancelled",
  "rejected",
  "approved",
  "waiting_for_payment",
  "payment_submitted",
] as const;

export type DbOrderStatus = (typeof DB_ORDER_STATUSES)[number];

/** App / UI status → value stored in `orders.status`. */
export const APP_TO_DB_ORDER_STATUS: Record<OrderStatus, DbOrderStatus> = {
  pending: "pending",
  approved: "approved",
  waiting_for_payment: "waiting_for_payment",
  payment_submitted: "payment_submitted",
  processing: "processing",
  shipping: "shipped",
  delivered: "delivered",
  refunded: "refund_processed",
  rejected: "rejected",
};

/** DB column values → app-facing status (for reads and admin UI). */
const DB_TO_APP_ORDER_STATUS: Record<string, OrderStatus> = {
  pending: "pending",
  confirmed: "approved",
  approved: "approved",
  waiting_for_payment: "waiting_for_payment",
  payment_submitted: "payment_submitted",
  processing: "processing",
  shipped: "shipping",
  shipping: "shipping",
  delivered: "delivered",
  returned: "refunded",
  refund_processed: "refunded",
  refunded: "refunded",
  cancelled: "rejected",
  rejected: "rejected",
};

/** @deprecated Use `toDbOrderStatus` */
export const LEGACY_DB_ORDER_STATUS: Partial<Record<OrderStatus, string>> = APP_TO_DB_ORDER_STATUS;

/** Strip zero-width chars / whitespace and unwrap nested payloads. */
export function extractOrderStatusString(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") {
    return raw.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  }
  if (Array.isArray(raw)) {
    return extractOrderStatusString(raw[0]);
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("status" in obj) return extractOrderStatusString(obj.status);
    if ("value" in obj) return extractOrderStatusString(obj.value);
  }
  return String(raw).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

export function isDbOrderStatus(value: string): value is DbOrderStatus {
  return (DB_ORDER_STATUSES as readonly string[]).includes(value);
}

export function toDbOrderStatus(appStatus: OrderStatus): DbOrderStatus {
  return APP_TO_DB_ORDER_STATUS[appStatus];
}

export function normalizeOrderStatus(status: unknown): OrderStatus {
  const cleaned = extractOrderStatusString(status);
  if (!cleaned) return "pending";
  if ((ORDER_STATUSES as readonly string[]).includes(cleaned)) {
    return cleaned as OrderStatus;
  }
  return DB_TO_APP_ORDER_STATUS[cleaned] ?? (cleaned as OrderStatus);
}

export function parseOrderStatusInput(
  raw: unknown
): { ok: true; app: OrderStatus; db: DbOrderStatus } | { ok: false; error: string } {
  const cleaned = extractOrderStatusString(raw);
  if (!cleaned) {
    return { ok: false, error: "Status is required" };
  }

  const app = normalizeOrderStatus(cleaned);
  if (!(ORDER_STATUSES as readonly string[]).includes(app)) {
    return { ok: false, error: `Invalid order status: ${cleaned}` };
  }

  const db = toDbOrderStatus(app);
  if (!isDbOrderStatus(db)) {
    return { ok: false, error: `Status cannot be stored in database: ${app}` };
  }

  return { ok: true, app, db };
}

/** Include DB aliases when querying by app status names. */
export function expandStatusesForQuery(statuses: OrderStatus[]): string[] {
  const expanded = new Set<string>();
  for (const status of statuses) {
    expanded.add(status);
    expanded.add(toDbOrderStatus(status));
    if (status === "approved") expanded.add("confirmed");
    if (status === "shipping") {
      expanded.add("shipped");
      expanded.add("shipping");
    }
    if (status === "refunded") {
      expanded.add("refund_processed");
      expanded.add("returned");
      expanded.add("refunded");
    }
    if (status === "rejected") expanded.add("cancelled");
  }
  return [...expanded];
}

export const RETURN_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "shipping",
  "inspecting",
  "refunded",
] as const satisfies readonly ReturnStatus[];

const APPROVED_PIPELINE: OrderStatus[] = ["approved", "processing", "shipping"];

/** Valid next statuses from each order status (reject uses delete flow) */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["approved", "waiting_for_payment"],
  approved: ["processing"],
  waiting_for_payment: [],
  payment_submitted: ["processing", "waiting_for_payment"],
  processing: ["shipping"],
  shipping: ["delivered"],
  delivered: [],
  refunded: [],
  rejected: [],
};

export const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["shipping"],
  shipping: ["inspecting"],
  inspecting: ["refunded"],
  refunded: [],
  rejected: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionReturn(from: ReturnStatus, to: ReturnStatus): boolean {
  return RETURN_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isOrderArchivedStatus(_status: OrderStatus): boolean {
  return false;
}

export function sectionFilters(section: AdminOrderSection): {
  orderType?: OrderType;
  orderStatuses?: OrderStatus[];
  archived?: boolean;
  returnStatuses?: ReturnStatus[];
  kind: "orders" | "returns" | "history";
} {
  switch (section) {
    case "newCustom":
      return {
        kind: "orders",
        orderType: "custom",
        orderStatuses: ["pending", "waiting_for_payment", "payment_submitted"],
        archived: false,
      };
    case "approvedCustom":
      return {
        kind: "orders",
        orderType: "custom",
        orderStatuses: ["processing", "shipping"],
        archived: false,
      };
    case "newStandard":
      return {
        kind: "orders",
        orderType: "standard",
        orderStatuses: ["pending"],
        archived: false,
      };
    case "approvedStandard":
      return {
        kind: "orders",
        orderType: "standard",
        orderStatuses: APPROVED_PIPELINE,
        archived: false,
      };
    case "history":
      return { kind: "history", archived: true };
    case "returns":
      return {
        kind: "returns",
        returnStatuses: ["pending"],
        archived: false,
      };
    case "approvedReturns":
      return {
        kind: "returns",
        returnStatuses: ["approved", "shipping", "inspecting"],
        archived: false,
      };
  }
}

export function validateOrderStatusUpdate(
  current: OrderStatus,
  next: OrderStatus,
  shippingInfo?: ShippingInfo
): { ok: true } | { ok: false; error: string } {
  if (current === next) {
    return { ok: false, error: "Order is already in this status" };
  }

  if (next === "rejected") {
    if (current !== "pending") {
      return { ok: false, error: "Only pending orders can be rejected" };
    }
    return { ok: true };
  }

  if (current === "payment_submitted" && next === "waiting_for_payment") {
    return { ok: true };
  }

  if (current === "payment_submitted" && next === "processing") {
    return { ok: true };
  }

  if (!canTransitionOrder(current, next)) {
    return {
      ok: false,
      error: `Cannot transition order from '${current}' to '${next}'`,
    };
  }

  if (next === "shipping" && !shippingInfo) {
    return { ok: false, error: "Shipping info is required when marking as shipping" };
  }

  return { ok: true };
}

export function validateReturnStatusUpdate(
  current: ReturnStatus,
  next: ReturnStatus
): { ok: true } | { ok: false; error: string } {
  if (current === next) {
    return { ok: false, error: "Return is already in this status" };
  }

  if (!canTransitionReturn(current, next)) {
    return {
      ok: false,
      error: `Cannot transition return from '${current}' to '${next}'`,
    };
  }

  return { ok: true };
}

export type AdminSectionCounts = Record<AdminOrderSection, number>;

export const ADMIN_SECTIONS: AdminOrderSection[] = [
  "newCustom",
  "approvedCustom",
  "newStandard",
  "approvedStandard",
  "returns",
  "approvedReturns",
  "history",
];
