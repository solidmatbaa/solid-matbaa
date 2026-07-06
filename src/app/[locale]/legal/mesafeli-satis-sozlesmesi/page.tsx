import { setRequestLocale } from "next-intl/server";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import {
  distanceSalesSections,
  distanceSalesTitle,
} from "@/lib/legal/documents/distance-sales";

export default async function DistanceSalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDocumentLayout
      title={distanceSalesTitle}
      sections={distanceSalesSections}
      updatedLabel="Son güncelleme: 2026"
    />
  );
}
