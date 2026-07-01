"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import { getLocalizedText, formatCurrency, DEFAULT_PRICING_TIERS, resolveProductImageUrl } from "@/lib/utils";
import type { Product, Locale, PricingTier } from "@/types";

interface ProductDetailProps {
  productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [added, setAdded] = useState(false);

  const t = useTranslations("products");
  const tCart = useTranslations("cart");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()
      .then(({ data }) => {
        if (data) setProduct(data as Product);
      });
  }, [productId]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  const name = getLocalizedText(product.name, locale);
  const description = getLocalizedText(product.description, locale);
  const tiers =
    product.pricing_tiers?.length > 0
      ? product.pricing_tiers
      : DEFAULT_PRICING_TIERS;
  const minPrice = Math.min(...tiers.map((t) => t.price));
  const imageSrc = resolveProductImageUrl(product.image_url);

  function handleConfirmAdd() {
    if (!selectedTier) return;
    addItem({
      productId: product!.id,
      productName: product!.name,
      price: selectedTier.price,
      tierQuantity: selectedTier.quantity,
      imageUrl: resolveProductImageUrl(product!.image_url),
    });
    setShowModal(false);
    setSelectedTier(null);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <Image src={imageSrc} alt={name} fill className="object-cover" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            <p className="text-gray-600 mb-6">{description}</p>
            <p className="text-2xl font-bold text-brand-700 mb-6">
              {t("from")} {formatCurrency(minPrice, locale)}
            </p>

            <div className="mb-6 space-y-2">
              {tiers.map((tier) => (
                <div
                  key={tier.quantity}
                  className="flex justify-between text-sm text-gray-600 border-b border-gray-100 pb-2"
                >
                  <span>{tier.quantity} {tCart("pieces")}</span>
                  <span className="font-medium text-brand-700">
                    {formatCurrency(tier.price, locale)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowModal(true)}
                size="lg"
                className="flex-1"
              >
                {added ? tCart("itemAdded") : t("addToCart")}
              </Button>
              <Button
                onClick={() => router.push("/cart")}
                variant="secondary"
                size="lg"
              >
                {tCart("title")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">{t("selectQuantity")}</h3>
            <div className="space-y-2 mb-6">
              {tiers.map((tier) => (
                <Button
                  key={tier.quantity}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  variant="secondary"
                  fullWidth
                  className={cn(
                    "justify-between font-normal",
                    selectedTier?.quantity === tier.quantity &&
                      "border-brand-500 bg-brand-50 text-brand-700"
                  )}
                >
                  <span>{tier.quantity} {tCart("pieces")}</span>
                  <span className="font-semibold">{formatCurrency(tier.price, locale)}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleConfirmAdd}
                disabled={!selectedTier}
                className="flex-1"
              >
                {tCart("confirmAdd")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedTier(null);
                }}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
