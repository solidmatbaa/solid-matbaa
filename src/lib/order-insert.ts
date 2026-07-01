import { BANK_ACCOUNT_HOLDER_NAME, stripPaymentIbanFromPayload } from "@/lib/payment-details";

/** Values allowed by `orders_status_check` (migration 020+). */
export const DB_ORDER_STATUS_CHECK_VALUES = [
  "pending",
  "pending_approval",
  "pending_payment",
  "paid",
  "approved",
  "waiting_for_payment",
  "payment_submitted",
  "processing",
  "shipping",
  "delivered",
  "refunded",
  "rejected",
] as const;

export type DbOrderStatusCheckValue = (typeof DB_ORDER_STATUS_CHECK_VALUES)[number];

/** Initial status for standard checkout orders (payment receipt attached). */
export const INITIAL_STANDARD_ORDER_STATUS = "pending" satisfies DbOrderStatusCheckValue;

/** Initial status for custom quote requests (admin must approve before payment). */
export const INITIAL_CUSTOM_ORDER_STATUS = "pending_approval" satisfies DbOrderStatusCheckValue;

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

/** Custom quote insert — always includes an explicit pending_approval status. */
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
