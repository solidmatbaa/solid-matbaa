import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_DESIGNS_BUCKET } from "@/lib/order-files";
import {
  ensurePaymentReceiptsStorage,
  isPaymentReceiptMimeType,
  normalizePaymentReceiptMimeType,
  PAYMENT_RECEIPTS_BUCKET,
} from "@/lib/payment-receipts-storage";

export {
  PAYMENT_RECEIPTS_BUCKET,
  PAYMENT_RECEIPT_MIME_TYPES,
  ensurePaymentReceiptsStorage,
  isPaymentReceiptMimeType,
  normalizePaymentReceiptMimeType,
} from "@/lib/payment-receipts-storage";

/** @deprecated Use PAYMENT_RECEIPTS_BUCKET */
export const ORDER_RECEIPTS_BUCKET = PAYMENT_RECEIPTS_BUCKET;

export async function uploadOrderDesignPdf(params: {
  tenantId: string;
  userId: string;
  fileName: string;
  buffer: Buffer;
}): Promise<{ url: string; path: string } | { error: string }> {
  const safeName = `${Date.now()}-${params.fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const objectPath = `${params.tenantId}/${params.userId}/${safeName}`;
  const admin = createAdminClient();

  const { error } = await admin.storage.from(ORDER_DESIGNS_BUCKET).upload(objectPath, params.buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    console.error("[uploadOrderDesignPdf]", error.message);
    return { error: error.message };
  }

  return { url: objectPath, path: objectPath };
}

export async function uploadPaymentReceipt(params: {
  tenantId: string;
  userId: string;
  orderId: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string; path: string } | { error: string }> {
  const contentType = normalizePaymentReceiptMimeType(params.contentType);
  if (!contentType) {
    return { error: "Invalid file type. Use JPG, PNG, or PDF." };
  }

  const admin = createAdminClient();
  const ensured = await ensurePaymentReceiptsStorage(admin);
  if (!ensured.ok) {
    console.error("[uploadPaymentReceipt] bucket setup failed:", ensured.error);
    return { error: ensured.error };
  }

  const ext = params.fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${params.orderId}-${Date.now()}.${ext.replace(/[^a-z0-9]/g, "")}`;
  const objectPath = `${params.tenantId}/${params.userId}/${safeName}`;

  const { error } = await admin.storage.from(PAYMENT_RECEIPTS_BUCKET).upload(objectPath, params.buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    console.error("[uploadPaymentReceipt]", error.message);
    return { error: error.message };
  }

  return { url: objectPath, path: objectPath };
}

/** @deprecated Use uploadPaymentReceipt */
export const uploadOrderPaymentReceipt = uploadPaymentReceipt;
