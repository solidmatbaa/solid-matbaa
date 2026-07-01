import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale, LocalizedString, Order, OrderItem } from "@/types";
import { getLocalizedText } from "@/lib/utils";

/** Parse JSONB fields that may arrive as strings from the API/database. */
export function parseJsonField<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
  return value as T;
}

const URL_KEYS = [
  "url",
  "link",
  "href",
  "product_url",
  "productUrl",
  "image_url",
  "imageUrl",
  "design_url",
  "designUrl",
  "file_url",
  "fileUrl",
] as const;

const NAME_KEYS = ["name", "title", "label", "product_name", "productName"] as const;

function isUsableUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /^file:\/\//i.test(trimmed)) return false;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/");
}

function extractUrlFromJson(obj: Record<string, unknown> | null | undefined): string | null {
  if (!obj) return null;
  for (const key of URL_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && isUsableUrl(value)) {
      return value.trim();
    }
  }
  return null;
}

function extractLocalizedName(value: unknown, locale: Locale): string {
  const parsed = parseJsonField<Record<string, unknown>>(value) ?? (
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
  );

  if (!parsed) {
    return typeof value === "string" ? value.trim() : "";
  }

  const direct = getLocalizedText(parsed as LocalizedString, locale);
  if (direct) return direct;

  for (const key of NAME_KEYS) {
    const nested = parsed[key];
    if (typeof nested === "string" && nested.trim()) return nested.trim();
    if (nested && typeof nested === "object") {
      const localized = getLocalizedText(nested as LocalizedString, locale);
      if (localized) return localized;
    }
  }

  for (const key of ["en", "ar", "tr"] as const) {
    const localeValue = parsed[key];
    if (typeof localeValue === "string" && localeValue.trim()) {
      return localeValue.trim();
    }
  }

  return "";
}

function normalizeSpecs(value: unknown): Record<string, string> {
  const parsed = parseJsonField<Record<string, unknown>>(value);
  const source =
    parsed ??
    (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {});

  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(source)) {
    if (raw == null) continue;
    if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
      result[key] = String(raw);
    }
  }
  return result;
}

function normalizeLocalizedName(value: unknown): LocalizedString | null {
  const name = extractLocalizedName(value, "en");
  if (!name) return null;
  return { en: name, ar: name, tr: name };
}

export function normalizeOrderItem(raw: Record<string, unknown>): OrderItem {
  const specs = normalizeSpecs(raw.specs);
  const productNameRaw = parseJsonField<Record<string, unknown>>(raw.product_name) ?? raw.product_name;

  return {
    id: String(raw.id ?? ""),
    order_id: String(raw.order_id ?? ""),
    product_id: (raw.product_id as string | null) ?? null,
    product_name: normalizeLocalizedName(raw.product_name),
    quantity: Number(raw.quantity ?? 0),
    unit_price: Number(raw.unit_price ?? 0),
    specs,
    size: (raw.size as string | null) ?? null,
    image_url:
      (raw.image_url as string | null) ??
      extractUrlFromJson(
        typeof productNameRaw === "object" && productNameRaw !== null
          ? (productNameRaw as Record<string, unknown>)
          : null
      ) ??
      extractUrlFromJson(specs as unknown as Record<string, unknown>),
    created_at: String(raw.created_at ?? ""),
  };
}

export type ParsedLineItemDetails = {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sizeLabel: string | null;
  specsLabel: string | null;
  productPageHref: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
};

export function extractLineItemDetails(
  item: OrderItem,
  locale: Locale,
  fallbackName: string
): ParsedLineItemDetails {
  const rawName =
    parseJsonField<Record<string, unknown>>(item.product_name) ??
    (item.product_name as unknown as Record<string, unknown> | null);
  const rawSpecs = item.specs as Record<string, unknown>;

  const productName = extractLocalizedName(rawName ?? item.product_name, locale) || fallbackName;
  const quantity = Number(item.quantity ?? 0);
  const unitPrice = Number(item.unit_price ?? 0);
  const lineTotal = unitPrice * (quantity || 1);

  const sizeLabel =
    item.size?.trim() ||
    item.specs?.design_size?.trim() ||
    (item.specs?.tierQuantity ? `${item.specs.tierQuantity} pcs` : null) ||
    null;

  const specEntries: string[] = [];
  if (item.specs?.type === "custom_print") {
    specEntries.push("Custom print");
  }
  for (const [key, value] of Object.entries(item.specs ?? {})) {
    if (!value || key === "design_size" || key === "tierQuantity" || key === "type") continue;
    if (URL_KEYS.includes(key as (typeof URL_KEYS)[number])) continue;
    specEntries.push(`${key}: ${value}`);
  }
  const specsLabel = specEntries.length > 0 ? specEntries.join(" · ") : null;

  const urlFromName = extractUrlFromJson(rawName);
  const urlFromSpecs = extractUrlFromJson(rawSpecs);
  const jsonPrice =
    typeof rawName?.price === "number"
      ? rawName.price
      : typeof rawName?.price === "string"
        ? Number(rawName.price)
        : typeof rawSpecs?.price === "number"
          ? rawSpecs.price
          : typeof rawSpecs?.price === "string"
            ? Number(rawSpecs.price)
            : NaN;

  const resolvedUnitPrice = unitPrice > 0 ? unitPrice : Number.isFinite(jsonPrice) ? jsonPrice : 0;

  const productPageHref = item.product_id ? `/designs/${item.product_id}` : null;
  const externalUrl =
    urlFromName ??
    urlFromSpecs ??
    (item.image_url && isUsableUrl(item.image_url) ? item.image_url : null);

  return {
    productName,
    quantity,
    unitPrice: resolvedUnitPrice,
    lineTotal: resolvedUnitPrice * (quantity || 1),
    sizeLabel,
    specsLabel,
    productPageHref,
    externalUrl,
    imageUrl: item.image_url,
  };
}

/** Always returns an array of normalized line items for an order payload. */
export function getOrderLineItems(order: Order | Record<string, unknown>): OrderItem[] {
  const embedded = order.order_items;

  if (Array.isArray(embedded)) {
    return embedded.map((item) =>
      normalizeOrderItem(item as unknown as Record<string, unknown>)
    );
  }

  if (embedded && typeof embedded === "object") {
    return [normalizeOrderItem(embedded as unknown as Record<string, unknown>)];
  }

  return [];
}

export function normalizeAdminOrder<T extends Record<string, unknown>>(
  order: T
): T & { order_items: OrderItem[] } {
  return {
    ...order,
    order_items: getOrderLineItems(order),
  };
}

/**
 * Loads order_items by order_id (order_items.order_id → orders.id).
 * Used when the nested Supabase embed is empty or unavailable.
 */
export async function attachLineItemsToOrders(
  admin: SupabaseClient,
  orders: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown> & { order_items: OrderItem[] }>> {
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => String(order.id));

  const { data: rows, error } = await admin
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  if (error) {
    console.error("[order-items] Failed to batch-fetch order_items:", error.message);
  }

  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const raw of rows ?? []) {
    const item = normalizeOrderItem(raw as Record<string, unknown>);
    if (!item.order_id) continue;
    const list = itemsByOrderId.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrderId.set(item.order_id, list);
  }

  return orders.map((order) => {
    const orderId = String(order.id);
    const embedded = getOrderLineItems(order);
    const fetched = itemsByOrderId.get(orderId) ?? [];
    const order_items = fetched.length > 0 ? fetched : embedded;

    return { ...order, order_items };
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Ensures product_name is valid JSONB with en/ar/tr keys for Supabase. */
export function normalizeProductNameForDb(
  name: Record<string, unknown> | null | undefined
): LocalizedString {
  const pick = (key: "en" | "ar" | "tr") => {
    const value = name?.[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const en = pick("en") || pick("ar") || pick("tr") || "Product";
  return {
    en,
    ar: pick("ar") || en,
    tr: pick("tr") || en,
  };
}

export type OrderItemInsertRow = {
  order_id: string;
  product_id: string | null;
  product_name: LocalizedString;
  quantity: number;
  unit_price: number;
  specs: Record<string, unknown>;
  size: string;
  image_url?: string | null;
};

export type CheckoutCartLine = {
  productId: string;
  productName: Record<string, unknown>;
  price: number;
  tierQuantity: number;
  quantity: number;
  imageUrl?: string | null;
};

/** Maps checkout cart lines to order_items rows, verifying product_id against the catalog. */
export async function buildCheckoutOrderItemRows(
  admin: SupabaseClient,
  orderId: string,
  items: CheckoutCartLine[],
  resolveImageUrl: (url: string | null) => string | null
): Promise<OrderItemInsertRow[]> {
  const rows: OrderItemInsertRow[] = [];

  for (const item of items) {
    let productId: string | null = null;
    let catalogImageUrl: string | null = null;

    if (isValidUuid(item.productId)) {
      const { data: product } = await admin
        .from("products")
        .select("id, image_url")
        .eq("id", item.productId)
        .maybeSingle();

      if (product) {
        productId = product.id;
        catalogImageUrl = product.image_url;
      }
    }

    rows.push({
      order_id: orderId,
      product_id: productId,
      product_name: normalizeProductNameForDb(item.productName),
      quantity: item.quantity,
      unit_price: item.price,
      specs: { tierQuantity: String(item.tierQuantity) },
      size: `${item.tierQuantity} pcs`,
      image_url: resolveImageUrl(catalogImageUrl ?? item.imageUrl ?? null),
    });
  }

  return rows;
}

/**
 * Inserts order line items one at a time. Rolls back the parent order when insert fails.
 */
export async function insertOrderLineItems(
  admin: SupabaseClient,
  rows: OrderItemInsertRow[],
  options?: { rollbackOrderId?: string }
): Promise<{ error: string | null }> {
  if (rows.length === 0) {
    return { error: "No line items to insert" };
  }

  for (const row of rows) {
    let { error } = await admin.from("order_items").insert(row);

    if (error && row.image_url != null) {
      const { image_url: _imageUrl, ...withoutImage } = row;
      ({ error } = await admin.from("order_items").insert(withoutImage));
    }

    if (error) {
      console.error(
        "[order-items] Insert failed:",
        error.message,
        error.details,
        error.hint,
        row
      );

      if (options?.rollbackOrderId) {
        await admin.from("orders").delete().eq("id", options.rollbackOrderId);
      }

      return { error: error.message };
    }
  }

  return { error: null };
}
