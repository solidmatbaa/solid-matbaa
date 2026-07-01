import { ProductDetail } from "@/components/products/ProductDetail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
