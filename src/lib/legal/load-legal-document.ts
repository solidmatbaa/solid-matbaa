import { getTranslations } from "next-intl/server";
import type { LegalSection } from "@/lib/legal/company";

export type LegalDocumentId = "deliveryReturns" | "privacy" | "distanceSales";

export async function loadLegalDocument(documentId: LegalDocumentId, locale: string) {
  const t = await getTranslations("legalDocuments");

  const sections = t.raw(`${documentId}.sections`) as LegalSection[];

  return {
    title: t(`${documentId}.title`),
    sections,
    updatedLabel: t("updatedLabel"),
    disclaimer: locale === "tr" ? null : t("disclaimer"),
  };
}
