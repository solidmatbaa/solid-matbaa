import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";

export default async function DesignsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("designs");

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {t("title")}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(products as Product[] | null)?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {(!products || products.length === 0) && (
        <p className="text-center text-gray-500 py-12">{t("empty")}</p>
      )}
    </div>
  );
}
