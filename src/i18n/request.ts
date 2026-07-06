import { getRequestConfig } from "next-intl/server";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import tr from "../messages/tr.json";
import legalAr from "../messages/legal/ar.json";
import legalEn from "../messages/legal/en.json";
import legalTr from "../messages/legal/tr.json";
import { routing } from "./routing";

const localeMessages = { en, ar, tr } as const;
const legalMessages = { en: legalEn, ar: legalAr, tr: legalTr } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "ar" | "tr")) {
    locale = routing.defaultLocale;
  }
  const base = localeMessages[locale as keyof typeof localeMessages];
  const legal = legalMessages[locale as keyof typeof legalMessages];
  return {
    locale,
    messages: { ...base, ...legal },
  };
});
