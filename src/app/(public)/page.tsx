import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { webPageGraphJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { getSiteUrl } from "@/lib/seo/site";
import { HERO } from "@/content/home";

/**
 * Apex kanonik adresin (https://www.mezbahateknolojileri.com/ — önek yok, DEFAULT_LOCALE="en")
 * WhatsApp/sosyal medya paylaşım önizlemesi için özel OG ve Twitter metni + görsel. Yalnızca
 * bu paylaşım etiketlerini değiştirir — sayfanın gerçek title/description'ı (Google için)
 * ve diğer dillerin (/tr, /de, ...) kendi metadata'sı DOKUNULMAZ (bkz. src/lib/seo/metadata.ts).
 */
const APEX_OG_TITLE = "Slaughterhouse Technologies | Modern Slaughtering & Meat Processing Systems";
const APEX_OG_DESCRIPTION =
  "Modern slaughtering lines, equipment and industrial solutions for slaughterhouses and meat processing facilities.";
const APEX_OG_IMAGE_PATH = "/images/og/mezbaha-teknolojileri-og.jpg";

import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { ProductCategories } from "@/components/home/product-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Engineering } from "@/components/home/engineering";
import { Capabilities } from "@/components/home/capabilities";
import { KnowledgeCenter } from "@/components/home/knowledge-center";
import { SalesNetwork } from "@/components/home/sales-network";
import { HomeVideos } from "@/components/home/home-videos";
import { HomeSeoText } from "@/components/home/home-seo-text";
import { Presentation } from "@/components/home/presentation";
import { FinalCta } from "@/components/home/final-cta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const d = getDictionary(locale).home.meta;
  const base = await buildMetadata({ title: d.title, description: d.description, path: "/", locale });

  if (locale !== DEFAULT_LOCALE) {
    return { ...base, title: { absolute: d.title } };
  }

  const ogImageMeta = await getLocalImageMeta(APEX_OG_IMAGE_PATH);
  const ogImageUrl = new URL(APEX_OG_IMAGE_PATH, getSiteUrl()).toString();
  const ogImage = { url: ogImageUrl, ...(ogImageMeta ? { width: ogImageMeta.width, height: ogImageMeta.height, type: ogImageMeta.type } : {}) };

  return {
    ...base,
    title: { absolute: d.title },
    openGraph: { ...base.openGraph, title: APEX_OG_TITLE, description: APEX_OG_DESCRIPTION, images: [ogImage] },
    twitter: { ...base.twitter, title: APEX_OG_TITLE, description: APEX_OG_DESCRIPTION, images: [ogImageUrl] },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const d = getDictionary(locale).home;
  const heroImageMeta = await getLocalImageMeta(HERO.image);

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          webPageGraphJsonLd({
            path: "/",
            name: d.meta.title,
            description: d.meta.description,
            locale,
            primaryImage: { url: HERO.image, name: d.hero.imageAlt, ...(heroImageMeta ? { dimensions: heroImageMeta } : {}) },
          })
        )}
      />
      <Hero />
      <Intro />
      <ProductCategories />
      <FeaturedProducts />
      <Engineering />
      <Capabilities />
      <Presentation />
      <SalesNetwork />
      <HomeVideos />
      <HomeSeoText />
      <KnowledgeCenter />
      <FinalCta />
    </main>
  );
}
