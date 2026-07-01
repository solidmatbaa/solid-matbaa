import { setRequestLocale } from "next-intl/server";
import { CustomPrintingPageContent } from "@/components/custom-printing/CustomPrintingPageContent";

export default async function CustomPrintingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomPrintingPageContent />;
}
