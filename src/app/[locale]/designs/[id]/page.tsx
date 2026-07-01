import { setRequestLocale } from "next-intl/server";
import { ProductDetail } from "@/components/products/ProductDetail";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ProductDetail productId={id} />;
}
