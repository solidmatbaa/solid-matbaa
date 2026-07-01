import type { SupabaseClient } from "@supabase/supabase-js";

export const PAYMENT_RECEIPTS_BUCKET = "payment-receipts";

export const PAYMENT_RECEIPT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type PaymentReceiptMimeType = (typeof PAYMENT_RECEIPT_MIME_TYPES)[number];

const PAYMENT_RECEIPT_MIME_SET = new Set<string>(PAYMENT_RECEIPT_MIME_TYPES);

const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

let storageEnsured = false;

export function isPaymentReceiptMimeType(contentType: string): contentType is PaymentReceiptMimeType {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return PAYMENT_RECEIPT_MIME_SET.has(normalized);
}

export function normalizePaymentReceiptMimeType(contentType: string): PaymentReceiptMimeType | null {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return PAYMENT_RECEIPT_MIME_SET.has(normalized)
    ? (normalized as PaymentReceiptMimeType)
    : null;
}

/** Idempotently create/update the payment-receipts bucket via the service-role client. */
export async function ensurePaymentReceiptsStorage(
  admin: SupabaseClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (storageEnsured) {
    return { ok: true };
  }

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    return { ok: false, error: listError.message };
  }

  const exists = buckets?.some(
    (bucket) => bucket.id === PAYMENT_RECEIPTS_BUCKET || bucket.name === PAYMENT_RECEIPTS_BUCKET
  );

  const bucketOptions = {
    public: false,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: [...PAYMENT_RECEIPT_MIME_TYPES],
  };

  const { error } = exists
    ? await admin.storage.updateBucket(PAYMENT_RECEIPTS_BUCKET, bucketOptions)
    : await admin.storage.createBucket(PAYMENT_RECEIPTS_BUCKET, bucketOptions);

  if (error) {
    return { ok: false, error: error.message };
  }

  storageEnsured = true;
  return { ok: true };
}
