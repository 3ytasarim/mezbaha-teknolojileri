import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { webPageGraphJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { HERO } from "@/content/home";

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
  return { ...base, title: { absolute: d.title } };
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
