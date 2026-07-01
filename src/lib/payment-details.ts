/** Fixed bank account holder for all bank transfer payments */
export const BANK_ACCOUNT_HOLDER_NAME = "Hamza Ghazal";

/** IBAN is display-only (from site settings); never persist on order submission. */
export function stripPaymentIbanFromPayload<T extends object>(payload: T): T {
  const record = payload as T & { payment_iban?: unknown; paymentIban?: unknown };
  const { payment_iban: _a, paymentIban: _b, ...rest } = record;
  return rest as T;
}
