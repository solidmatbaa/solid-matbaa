/** Fixed bank account holder for all bank transfer payments */
export const BANK_ACCOUNT_HOLDER_NAME = "Hamza Ghazal";

/**
 * Site-wide IBAN for bank transfers. Set via NEXT_PUBLIC_SITE_IBAN when possible;
 * otherwise the read-only value from settings is used for display only.
 */
export function getSiteIban(fallback?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_IBAN?.trim();
  if (fromEnv) return fromEnv;
  return fallback?.trim() ?? "";
}

/** IBAN is display-only; never persist on order submission. */
export function stripPaymentIbanFromPayload<T extends object>(payload: T): T {
  const record = payload as T & { payment_iban?: unknown; paymentIban?: unknown };
  const { payment_iban: _a, paymentIban: _b, ...rest } = record;
  return rest as T;
}

export { buildStandardOrderInsert, type StandardOrderInsertInput } from "@/lib/order-insert";
