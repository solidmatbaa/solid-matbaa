"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";
import { motion } from "framer-motion";
import { pressableHover, pressableTap, pressableTransition } from "@/lib/pressable-motion";
import { useCart } from "@/context/CartContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { getLocalizedText, formatCurrency, cartItemKey, resolveProductImageUrl } from "@/lib/utils";
import type { Locale } from "@/types";

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const { items, total, removeItem, updateQuantity } = useCart();

  return (
    <AuthGuard>
      {items.length === 0 ? (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-700 mb-2">{t("empty")}</h1>
          <MotionLink
            href="/designs"
            className="inline-block mt-4 px-6 py-2 bg-brand-500 text-gray-900 rounded-lg hover:bg-brand-600 transition-colors"
          >
            {t("continueShopping")}
          </MotionLink>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

          <div className="space-y-4 mb-8">
            {items.map((item) => {
              const key = cartItemKey(item.productId, item.tierQuantity);
              return (
                <div
                  key={key}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={resolveProductImageUrl(item.imageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {getLocalizedText(item.productName, locale)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.tierQuantity} {t("pieces")} × {formatCurrency(item.price, locale)}
                    </p>
                    <p className="text-brand-700 font-medium mt-2">
                      {formatCurrency(item.price * item.quantity, locale)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={() => updateQuantity(key, item.quantity - 1)}
                        whileHover={pressableHover}
                        whileTap={pressableTap}
                        transition={pressableTransition}
                        className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors"
                      >
                        −
                      </motion.button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <motion.button
                        type="button"
                        onClick={() => updateQuantity(key, item.quantity + 1)}
                        whileHover={pressableHover}
                        whileTap={pressableTap}
                        transition={pressableTransition}
                        className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors"
                      >
                        +
                      </motion.button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(key)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">{t("total")}</span>
              <span className="text-xl font-bold text-brand-700">
                {formatCurrency(total, locale)}
              </span>
            </div>
            <MotionLink
              href="/checkout"
              fullWidth
              className="block w-full text-center px-6 py-3 bg-brand-500 text-gray-900 font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              {t("checkout")}
            </MotionLink>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
