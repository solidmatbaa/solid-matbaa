import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {t("title")}
        </h1>
        <p className="text-lg text-gray-600">{t("subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("mission")}</h2>
        <p className="text-gray-600 leading-relaxed">{t("missionText")}</p>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t("values")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {(["quality", "reliability", "service"] as const).map((value) => (
          <div
            key={value}
            className="bg-white rounded-xl border border-gray-100 p-6 text-center"
          >
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t(value)}</h3>
            <p className="text-sm text-gray-600">{t(`${value}Text`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
