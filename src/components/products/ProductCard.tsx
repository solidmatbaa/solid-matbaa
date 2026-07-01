"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { MotionLink } from "@/components/ui/MotionLink";
import type { Product, Locale } from "@/types";
import { getLocalizedText, formatCurrency, DEFAULT_PRICING_TIERS, resolveProductImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations("products");
  const locale = useLocale() as Locale;
  const name = getLocalizedText(product.name, locale);
  const description = getLocalizedText(product.description, locale);
  const tiers = product.pricing_tiers?.length > 0 ? product.pricing_tiers : DEFAULT_PRICING_TIERS;
  const minPrice = Math.min(...tiers.map((tier) => tier.price));
  const imageSrc = resolveProductImageUrl(product.image_url);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex flex-col",
        className
      )}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-brand-700">
            {t("from")} {formatCurrency(minPrice, locale)}
          </span>
          <MotionLink
            href={`/designs/${product.id}`}
            className="px-4 py-2 bg-brand-500 text-gray-900 text-sm rounded-xl hover:bg-brand-600 transition-colors duration-200"
          >
            {t("addToCart")}
          </MotionLink>
        </div>
      </div>
    </div>
  );
}
