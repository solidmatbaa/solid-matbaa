import { getRequestConfig } from "next-intl/server";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import tr from "../messages/tr.json";
import { routing } from "./routing";

const localeMessages = { en, ar, tr } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "ar" | "tr")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: localeMessages[locale as keyof typeof localeMessages],
  };
});
