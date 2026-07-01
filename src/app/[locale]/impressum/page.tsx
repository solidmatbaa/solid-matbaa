import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalizedText } from "@/lib/utils";
import type { Locale, Settings } from "@/types";
import { SOCIAL_LINKS } from "@/lib/social-links";

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("impressum");
  const loc = locale as Locale;

  const supabase = await createClient();
  const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "solid-matbaa";

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  let contact = { email: "info@solidmatbaa.com", phone: "", address: { en: "", ar: "", tr: "" } };
  if (tenant) {
    const { data: settings } = await supabase
      .from("settings")
      .select("contact_info, iban")
      .eq("tenant_id", tenant.id)
      .single();
    if (settings) {
      contact = (settings as Settings).contact_info;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("title")}</h1>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        <section className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">{t("company")}</h2>
          <p className="text-gray-700">{t("companyName")}</p>
        </section>

        <section className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">{t("address")}</h2>
          <p className="text-gray-700">{getLocalizedText(contact.address, loc)}</p>
        </section>

        <section className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">{t("contact")}</h2>
          <dl className="space-y-2 text-gray-700">
            <div>
              <dt className="text-sm text-gray-500">{t("email")}</dt>
              <dd>{contact.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t("phone")}</dt>
              <dd>{contact.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">WhatsApp</dt>
              <dd>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  +90 501 555 4010
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Instagram</dt>
              <dd>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline break-all"
                >
                  @solid_matbaa
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Facebook</dt>
              <dd>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline break-all"
                >
                  Solid Matbaa
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">{t("registration")}</h2>
          <p className="text-gray-700">{t("registrationText")}</p>
        </section>

        <section className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">{t("disclaimer")}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{t("disclaimerText")}</p>
        </section>
      </div>
    </div>
  );
}
