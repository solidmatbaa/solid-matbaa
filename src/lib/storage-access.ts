import { ORDER_DESIGNS_BUCKET } from "@/lib/order-files";
import { PAYMENT_RECEIPTS_BUCKET } from "@/lib/payment-receipts-storage";

const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";

/** Extract object path from a stored path or legacy public Supabase URL. */
export function resolveStorageObjectPath(
  bucket: string,
  pathOrUrl: string | null | undefined
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = pathOrUrl.trim();

  const marker = `${PUBLIC_OBJECT_PREFIX}${bucket}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex >= 0) {
    return decodeURIComponent(value.slice(markerIndex + marker.length));
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return null;
  }

  return value.replace(/^\/+/, "");
}

/** Client-safe link that redirects to a short-lived signed URL after auth check. */
export function storageAccessUrl(
  bucket: string,
  pathOrUrl: string | null | undefined
): string | null {
  const path = resolveStorageObjectPath(bucket, pathOrUrl);
  if (!path) return null;
  const params = new URLSearchParams({ bucket, path });
  return `/api/files/access?${params.toString()}`;
}

export function paymentReceiptAccessUrl(pathOrUrl: string | null | undefined): string | null {
  return storageAccessUrl(PAYMENT_RECEIPTS_BUCKET, pathOrUrl);
}

export function orderDesignAccessUrl(pathOrUrl: string | null | undefined): string | null {
  return storageAccessUrl(ORDER_DESIGNS_BUCKET, pathOrUrl);
}
