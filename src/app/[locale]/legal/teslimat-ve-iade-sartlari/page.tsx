import { setRequestLocale } from "next-intl/server";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import {
  deliveryReturnsSections,
  deliveryReturnsTitle,
} from "@/lib/legal/documents/delivery-returns";

export default async function DeliveryReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDocumentLayout
      title={deliveryReturnsTitle}
      sections={deliveryReturnsSections}
      updatedLabel="Son güncelleme: 2026"
    />
  );
}
