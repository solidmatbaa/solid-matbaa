import { setRequestLocale } from "next-intl/server";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { loadLegalDocument } from "@/lib/legal/load-legal-document";

export default async function DeliveryReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const doc = await loadLegalDocument("deliveryReturns", locale);

  return (
    <LegalDocumentLayout
      title={doc.title}
      sections={doc.sections}
      updatedLabel={doc.updatedLabel}
      disclaimer={doc.disclaimer}
    />
  );
}
