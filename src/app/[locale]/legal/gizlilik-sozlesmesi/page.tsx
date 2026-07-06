import { setRequestLocale } from "next-intl/server";
import { LegalDocumentLayout } from "@/components/legal/LegalDocumentLayout";
import { privacySections, privacyTitle } from "@/lib/legal/documents/privacy";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDocumentLayout
      title={privacyTitle}
      sections={privacySections}
      updatedLabel="Son güncelleme: 2026"
    />
  );
}
