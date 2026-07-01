"use client";

import { Link } from "@/i18n/routing";
import type { Locale, Order } from "@/types";
import { formatCurrency, resolveProductImageUrl } from "@/lib/utils";
import { extractLineItemDetails, getOrderLineItems } from "@/lib/order-items";

interface AdminOrderItemsProps {
  order: Order;
  locale: Locale;
  labels: {
    sectionTitle: string;
    product: string;
    quantity: string;
    unitPrice: string;
    price: string;
    size: string;
    specifications: string;
    noLineItems: string;
    customOrder: string;
    viewProduct: string;
    externalLink: string;
  };
}

function renderProductLink(
  details: ReturnType<typeof extractLineItemDetails>,
  labels: AdminOrderItemsProps["labels"]
) {
  const { productName, productPageHref, externalUrl } = details;

  if (productPageHref) {
    return (
      <Link href={productPageHref} className="text-brand-600 hover:underline font-medium">
        {productName}
      </Link>
    );
  }

  if (externalUrl) {
    const isInternal = externalUrl.startsWith("/");
    if (isInternal) {
      return (
        <Link href={externalUrl} className="text-brand-600 hover:underline font-medium">
          {productName}
        </Link>
      );
    }
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-600 hover:underline font-medium"
      >
        {productName}
      </a>
    );
  }

  return <span className="font-medium text-gray-900">{productName}</span>;
}

export function AdminOrderItems({ order, locale, labels }: AdminOrderItemsProps) {
  const lineItems = getOrderLineItems(order);
  const fallbackName = order.order_type === "custom" ? labels.customOrder : labels.product;

  if (lineItems.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400 italic">
        {labels.noLineItems}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">
        {labels.sectionTitle} ({lineItems.length})
      </h4>

      <div className="space-y-3">
        {lineItems.map((item, index) => {
          const details = extractLineItemDetails(item, locale, fallbackName);
          const imageSrc = resolveProductImageUrl(details.imageUrl);
          const itemKey = item.id || `${order.id}-item-${index}`;

          return (
            <div
              key={itemKey}
              className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 space-y-2"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSrc} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 space-y-1.5 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium text-gray-900">{labels.product}:</span>{" "}
                    {renderProductLink(details, labels)}
                  </p>

                  <p className="text-gray-700">
                    <span className="font-medium text-gray-900">{labels.quantity}:</span>{" "}
                    {details.quantity}
                  </p>

                  <p className="text-gray-700">
                    <span className="font-medium text-gray-900">{labels.unitPrice}:</span>{" "}
                    <span className="font-semibold text-brand-700">
                      {formatCurrency(details.unitPrice, locale)}
                    </span>
                  </p>

                  {details.quantity > 1 && (
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">{labels.price}:</span>{" "}
                      {formatCurrency(details.lineTotal, locale)}
                      <span className="text-gray-500 text-xs ms-1">
                        ({formatCurrency(details.unitPrice, locale)} × {details.quantity})
                      </span>
                    </p>
                  )}

                  {details.sizeLabel && (
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">{labels.size}:</span>{" "}
                      {details.sizeLabel}
                    </p>
                  )}

                  {details.specsLabel && (
                    <p className="text-gray-700">
                      <span className="font-medium text-gray-900">{labels.specifications}:</span>{" "}
                      {details.specsLabel}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-1">
                    {details.productPageHref && (
                      <Link
                        href={details.productPageHref}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        {labels.viewProduct} →
                      </Link>
                    )}
                    {details.externalUrl &&
                      details.externalUrl !== details.productPageHref && (
                        <a
                          href={details.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:underline"
                        >
                          {labels.externalLink} →
                        </a>
                      )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
