import type { ShippingInfo } from "@/types";

type ShippingInput = {
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  shipping_url?: string | null;
  shipping_company?: string | null;
  tracking_url?: string | null;
};

export function normalizeShippingInput(input: ShippingInput): ShippingInfo | null {
  const tracking_number = input.tracking_number?.trim();
  const shipping_carrier = (input.shipping_carrier ?? input.shipping_company)?.trim();
  const shipping_url = (input.shipping_url ?? input.tracking_url)?.trim();

  if (!tracking_number || !shipping_carrier || !shipping_url) {
    return null;
  }

  return { tracking_number, shipping_carrier, shipping_url };
}

type TrackingSource = {
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  shipping_url?: string | null;
  shipping_info?: ShippingInfo | null;
};

/** Read tracking from dedicated columns or legacy shipping_info JSONB. */
export function getOrderTracking(order: TrackingSource): ShippingInfo | null {
  const fromColumns = normalizeShippingInput({
    tracking_number: order.tracking_number,
    shipping_carrier: order.shipping_carrier,
    shipping_url: order.shipping_url,
  });
  if (fromColumns) return fromColumns;

  if (order.shipping_info) {
    return normalizeShippingInput(order.shipping_info);
  }

  return null;
}

/** Persist to columns and keep shipping_info JSONB in sync for legacy readers. */
export function shippingUpdatePayload(info: ShippingInfo): Record<string, unknown> {
  return {
    tracking_number: info.tracking_number,
    shipping_carrier: info.shipping_carrier,
    shipping_url: info.shipping_url,
    shipping_info: {
      tracking_number: info.tracking_number,
      shipping_company: info.shipping_carrier,
      tracking_url: info.shipping_url,
    },
  };
}
