import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale, LocalizedString } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalizedText(
  obj: LocalizedString | string | null | undefined,
  locale: Locale,
  fallback = ""
): string {
  if (!obj) return fallback;
  if (typeof obj === "string") {
    const parsed = obj.trim();
    if (parsed.startsWith("{")) {
      try {
        const json = JSON.parse(parsed) as LocalizedString;
        return json[locale] || json.en || fallback;
      } catch {
        return parsed || fallback;
      }
    }
    return parsed || fallback;
  }
  return obj[locale] || obj.en || fallback;
}

export function formatCurrency(amount: number | string | null | undefined, locale: Locale = "en"): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(date: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : locale === "tr" ? "tr-TR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  ).format(new Date(date));
}

export function specsMatch(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

export function cartItemKey(productId: string, tierQuantity: number): string {
  return `${productId}::${tierQuantity}`;
}

export const DEFAULT_PRICING_TIERS = [
  { quantity: 100, price: 19 },
  { quantity: 500, price: 39 },
  { quantity: 1000, price: 69 },
];

export const PRODUCT_IMAGE_PLACEHOLDER = "/placeholder.jpg";

/** True when the value is safe to pass to next/image `src`. */
export function isValidProductImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || /^file:\/\//i.test(trimmed)) return false;
  if (trimmed.startsWith("/")) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns a next/image-safe URL, falling back to the local placeholder. */
export function resolveProductImageUrl(url: string | null | undefined): string {
  return isValidProductImageUrl(url) ? url!.trim() : PRODUCT_IMAGE_PLACEHOLDER;
}

export function looksLikeHtmlResponse(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<HTML")
  );
}

export type SafeJsonParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; rawPreview: string; isHtml: boolean };

/** Parse JSON safely; logs failures and handles HTML/empty/trailing garbage. */
export function parseJsonText<T>(
  text: string,
  context?: { url?: string; status?: number; contentType?: string | null }
): SafeJsonParseResult<T> {
  const rawPreview = text.slice(0, 500);
  const isHtml = looksLikeHtmlResponse(text);

  if (!text || text.trim() === "") {
    console.warn("[parseJsonText] Empty response body", context);
    return { ok: false, error: "Empty response body", rawPreview, isHtml: false };
  }

  if (isHtml) {
    console.error("[parseJsonText] Expected JSON but received HTML", {
      ...context,
      rawPreview,
    });
    return {
      ok: false,
      error: "Server returned HTML instead of JSON (API or auth redirect error)",
      rawPreview,
      isHtml: true,
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch (firstError) {
    const trimmed = text.trim();

    // Some proxies/errors append extra bytes after valid JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const endIndex = findJsonEndIndex(trimmed);
        if (endIndex > 0) {
          const slice = trimmed.slice(0, endIndex + 1);
          const data = JSON.parse(slice) as T;
          console.warn("[parseJsonText] Parsed leading JSON; ignored trailing content", {
            ...context,
            trailingPreview: trimmed.slice(endIndex + 1, endIndex + 120),
          });
          return { ok: true, data };
        }
      } catch {
        // fall through to logged failure below
      }
    }

    const message =
      firstError instanceof Error ? firstError.message : "Invalid JSON response";
    console.error("[parseJsonText] JSON.parse failed", {
      ...context,
      error: message,
      rawPreview,
    });
    return { ok: false, error: message, rawPreview, isHtml: false };
  }
}

function findJsonEndIndex(text: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  const open = text[0];
  const close = open === "{" ? "}" : open === "[" ? "]" : "";

  if (!close) return -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === open) depth++;
    if (char === close) depth--;

    if (depth === 0) return i;
  }

  return -1;
}

export async function safeJsonParse<T>(
  response: Response,
  context?: { url?: string }
): Promise<T | null> {
  const text = await response.text();
  const parsed = parseJsonText<T>(text, {
    url: context?.url ?? response.url,
    status: response.status,
    contentType: response.headers.get("content-type"),
  });

  return parsed.ok ? parsed.data : null;
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; ok: boolean }> {
  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    });

    const text = await response.text();
    const parsed = parseJsonText<T>(text, {
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
    });

    if (!parsed.ok) {
      const errorMsg = parsed.isHtml
        ? "Server returned an HTML error page instead of JSON"
        : parsed.error;
      return { data: null, error: errorMsg, ok: false };
    }

    if (!response.ok) {
      const apiError = (parsed.data as { error?: string } | null)?.error;
      return {
        data: null,
        error: apiError || `Request failed with status ${response.status}`,
        ok: false,
      };
    }

    return { data: parsed.data, error: null, ok: true };
  } catch (err) {
    console.error("[fetchJson] Network or fetch failure", { url, err });
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
      ok: false,
    };
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; ok: boolean }> {
  const result = await fetchJson<{ success: boolean; data?: T; error?: string }>(
    url,
    options
  );

  if (!result.ok || !result.data) {
    return {
      data: null,
      error: result.error ?? "Request failed",
      ok: false,
    };
  }

  if (!result.data.success) {
    return {
      data: null,
      error: result.data.error ?? "Request failed",
      ok: false,
    };
  }

  return { data: result.data.data ?? null, error: null, ok: true };
}
