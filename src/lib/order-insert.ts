import { BANK_ACCOUNT_HOLDER_NAME, stripPaymentIbanFromPayload } from "@/lib/payment-details";

/**
 * Values allowed by `orders_status_check` (migration 013+).
 * Migration 019 also allows `pending_approval`; inserts use `pending` for custom quotes
 * so submissions work before that migration is applied.
 */
export const DB_ORDER_STATUS_CHECK_VALUES = [
  "pending",
  "approved",
  "waiting_for_payment",
  "payment_submitted",
  "processing",
  "shipping",
  "delivered",
  "refunded",
  "rejected",
  "pending_approval",
] as const;

export type DbOrderStatusCheckValue = (typeof DB_ORDER_STATUS_CHECK_VALUES)[number];

/** Initial status for standard checkout orders (payment receipt attached). */
export const INITIAL_STANDARD_ORDER_STATUS = "pending" satisfies DbOrderStatusCheckValue;

/** Initial status for custom quote requests (admin sets price before payment). */
export const INITIAL_CUSTOM_ORDER_STATUS = "pending" satisfies DbOrderStatusCheckValue;

export function assertValidOrderInsertStatus(
  status: string
): asserts status is DbOrderStatusCheckValue {
  if (!DB_ORDER_STATUS_CHECK_VALUES.includes(status as DbOrderStatusCheckValue)) {
    throw new Error(
      `Invalid order status "${status}". Allowed: ${DB_ORDER_STATUS_CHECK_VALUES.join(", ")}`
    );
  }
}

export interface StandardOrderInsertInput {
  orderId: string;
  tenantId: string;
  userId: string;
  shippingAddress: Record<string, unknown>;
  total: number;
  receiptUrl: string;
}

/** Allowed order columns only — excludes display-only fields like payment_iban. */
export function buildStandardOrderInsert(input: StandardOrderInsertInput) {
  const status = INITIAL_STANDARD_ORDER_STATUS;
  assertValidOrderInsertStatus(status);

  return {
    id: input.orderId,
    tenant_id: input.tenantId,
    user_id: input.userId,
    status,
    order_type: "standard" as const,
    is_archived: false,
    shipping_address: stripPaymentIbanFromPayload(input.shippingAddress),
    total_amount: input.total,
    receipt_url: input.receiptUrl,
    account_holder_name: BANK_ACCOUNT_HOLDER_NAME,
  };
}

export interface CustomOrderInsertInput {
  orderId: string;
  tenantId: string;
  userId: string;
  notes: string;
  designFileUrl: string;
}

/** Custom quote insert — always includes an explicit, constraint-safe status. */
export function buildCustomOrderInsert(input: CustomOrderInsertInput) {
  const status = INITIAL_CUSTOM_ORDER_STATUS;
  assertValidOrderInsertStatus(status);

  return {
    id: input.orderId,
    tenant_id: input.tenantId,
    user_id: input.userId,
    status,
    order_type: "custom" as const,
    total_amount: 0,
    notes: input.notes,
    design_file_url: input.designFileUrl,
    file_url: input.designFileUrl,
  };
}
