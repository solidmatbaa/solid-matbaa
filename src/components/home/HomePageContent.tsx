"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MotionLink } from "@/components/ui/MotionLink";
import { ProductCard } from "@/components/products/ProductCard";
import { MotionSection } from "@/components/ui/MotionSection";
import { getLocalizedText } from "@/lib/utils";
import type { Product, Locale, SiteContent } from "@/types";

interface HomePageContentProps {
  locale: Locale;
  siteContent: SiteContent;
  heroImages: string[];
  products: Product[] | null;
}

export function HomePageContent({
  locale,
  siteContent,
  heroImages,
  products,
}: HomePageContentProps) {
  const t = useTranslations("home");
  const hasHeroImage = heroImages.length > 0;

  return (
    <div>
      <MotionSection
        as="section"
        className="relative overflow-hidden bg-brand-500 text-white min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]"
      >
        {hasHeroImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(${heroImages[0]})` }}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/15"
              aria-hidden
            />
            <div className="absolute inset-0 bg-brand-500/10" aria-hidden />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600"
            aria-hidden
          />
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="hero-text text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              {getLocalizedText(siteContent.hero_title, locale)}
            </h1>
            <p className="hero-text-soft text-lg sm:text-xl text-white/95 mb-4 leading-relaxed max-w-2xl">
              {getLocalizedText(siteContent.hero_subtitle, locale)}
            </p>
            <p className="hero-text-soft text-base text-white/90 mb-10 leading-relaxed max-w-2xl">
              {t("heroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <MotionLink
                href="/designs"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-500 text-gray-900 font-semibold rounded-2xl hover:bg-brand-600 transition-colors shadow-lg shadow-black/20 border border-brand-500/30"
              >
                {getLocalizedText(siteContent.hero_button_designs, locale)}
              </MotionLink>
              <MotionLink
                href="/custom-printing"
                className="hero-text inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/90 text-white font-semibold rounded-2xl hover:bg-white/15 transition-colors backdrop-blur-sm"
              >
                {getLocalizedText(siteContent.hero_button_custom, locale)}
              </MotionLink>
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection delay={0.1} className="page-container">
        <div className="flex items-center justify-between mb-10 sm:mb-12">
          <h2 className="section-title">{t("featuredDesigns")}</h2>
          <Link
            href="/designs"
            className="text-brand-700 hover:text-brand-800 font-medium text-sm flex items-center gap-1 transition-all hover:scale-105"
          >
            {t("viewAll")}
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </MotionSection>

      <MotionSection delay={0.15} as="section" className="bg-white border-y border-gray-100">
        <div className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {(["quality", "custom", "delivery"] as const).map((feature) => (
              <div
                key={feature}
                className="card-soft text-center hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
                  <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t(`${feature}Title`)}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t(`${feature}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>
    </div>
  );
}
