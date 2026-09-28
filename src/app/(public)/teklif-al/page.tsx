import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getAllPublishedProducts } from "@/lib/queries";
import { ProductsHero } from "@/components/public/products-hero";
import { QuoteForm } from "@/components/public/quote-form";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({ title: d.quote.metaTitle, description: d.quote.metaDescription, path: "/teklif-al", locale });
}

/** Teklif talebi: ürün seçimi isteğe bağlı; ?urun=<slug> ile ürün önceden seçilir. */
export default async function QuotePage({ searchParams }: { searchParams: Promise<{ urun?: string }> }) {
  const { urun } = await searchParams;
  const { locale, d } = await getI18n();
  const products = await getAllPublishedProducts(locale);
  const options = products.map((p) => ({ id: p.id, name: p.translations[0]?.name ?? p.slug }));
  const preselected = products.find((p) => slugOf(p, locale) === urun)?.id;

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: d.quote.metaTitle, path: localizePath(locale, "/teklif-al") },
          ])
        )}
      />

      <ProductsHero
        eyebrow={d.quote.eyebrow}
        crumbs={[{ label: d.common.home, href: "/" }, { label: d.quote.metaTitle }]}
        title={d.quote.heroTitle}
        description={d.quote.heroDescription}
        chips={[]}
      />

      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <QuoteForm products={options} defaultProductId={preselected} />
        </div>
      </section>
    </main>
  );
}
