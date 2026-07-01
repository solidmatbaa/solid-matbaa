import type { Order } from "@/types";
import { normalizeOrderStatus } from "@/lib/order-transitions";
import { isCustomPendingPayment } from "@/lib/orders";
import { orderDesignAccessUrl } from "@/lib/storage-access";

export const ORDER_DESIGNS_BUCKET = "order-designs";

/** Resolve authenticated access URL for the customer design file. */
export function getOrderDesignFileUrl(
  order: Pick<Order, "design_file_url" | "file_url">
): string | null {
  const raw = order.design_file_url?.trim() || order.file_url?.trim();
  if (!raw || /^file:\/\//i.test(raw)) return null;
  return orderDesignAccessUrl(raw) ?? raw;
}

export function isPdfDesignUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".pdf") || lower.includes("application/pdf");
}

/** Custom orders awaiting customer bank transfer payment. */
export function canPayCustomOrder(order: {
  order_type: string;
  status: string;
  total_amount: number;
  receipt_url: string | null;
}): boolean {
  if (order.order_type !== "custom") return false;
  if (order.receipt_url) return false;
  if (isCustomPendingPayment(order)) return true;
  const status = normalizeOrderStatus(order.status);
  if (status === "approved" && order.total_amount > 0) return true;
  return false;
}
