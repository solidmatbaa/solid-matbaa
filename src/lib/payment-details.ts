/** Fixed bank account holder for all bank transfer payments */
export const BANK_ACCOUNT_HOLDER_NAME = "Hamza Ghazal";

/** IBAN is display-only (from site settings); never persist on order submission. */
export function stripPaymentIbanFromPayload<T extends object>(payload: T): T {
  const record = payload as T & { payment_iban?: unknown; paymentIban?: unknown };
  const { payment_iban: _a, paymentIban: _b, ...rest } = record;
  return rest as T;
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
  return {
    id: input.orderId,
    tenant_id: input.tenantId,
    user_id: input.userId,
    status: "pending" as const,
    order_type: "standard" as const,
    is_archived: false,
    shipping_address: stripPaymentIbanFromPayload(input.shippingAddress),
    total_amount: input.total,
    receipt_url: input.receiptUrl,
    account_holder_name: BANK_ACCOUNT_HOLDER_NAME,
  };
}
