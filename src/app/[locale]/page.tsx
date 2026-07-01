import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { HomePageContent } from "@/components/home/HomePageContent";
import type { Product, Locale, SiteContent } from "@/types";
import { SOCIAL_LINKS } from "@/lib/social-links";

const defaultSiteContent: SiteContent = {
  hero_title: {
    en: "Elevate your brand to the next level",
    ar: "ارتقِ بعلامتك التجارية إلى المستوى التالي",
    tr: "Markanızı bir üst seviyeye taşıyın",
  },
  hero_subtitle: {
    en: "Exclusive luxury-designed thank you cards",
    ar: "بطاقات شكر حصرية بتصميم فاخر",
    tr: "Lüks tasarımlı özel teşekkür kartları",
  },
  hero_button_designs: { en: "Designs", ar: "تصاميمنا", tr: "Tasarımlarımız" },
  hero_button_custom: { en: "Custom Printing", ar: "طباعة مخصصة", tr: "Özel Baskı" },
  instagram_url: SOCIAL_LINKS.instagram,
  facebook_url: SOCIAL_LINKS.facebook,
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const supabase = await createClient();
  const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "solid-matbaa";

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  let heroImages: string[] = [];
  let siteContent = defaultSiteContent;

  if (tenant) {
    const { data: settings } = await supabase
      .from("settings")
      .select("hero_images, site_content")
      .eq("tenant_id", tenant.id)
      .single();
    heroImages = (settings?.hero_images as string[]) ?? [];
    if (settings?.site_content) {
      siteContent = { ...defaultSiteContent, ...(settings.site_content as SiteContent) };
    }
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .limit(6);

  return (
    <HomePageContent
      locale={loc}
      siteContent={siteContent}
      heroImages={heroImages}
      products={products}
    />
  );
}
