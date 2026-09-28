import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import references from "@/content/legacy/references.json";
import { ProductsHero } from "@/components/public/products-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { ReferenceList } from "@/components/public/reference-list";
import { FinalCta } from "@/components/home/final-cta";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({ title: d.references.metaTitle, description: d.references.metaDescription, path: "/referanslar", locale });
}

/**
 * Referanslar — eski sitenin /tr/referanslar/ sayfasındaki kurum listesi (prisma/migration/acquire-references.ts;
 * kaynak: docs/references-provenance.json). Kurum adları ve yerleri kaynakla aynıdır; tür, adın içindeki anahtar kelimeden türetilir.
 */
export default async function ReferencesPage() {
  const { locale, d } = await getI18n();
  const r = d.references;
  const items = references.items;
  const foreign = items.filter((i) => i.foreign).length;
  const types = new Set(items.map((i) => i.type)).size;

  const stats = [
    { value: items.length, label: r.statRefs },
    { value: foreign, label: r.statForeign },
    { value: types, label: r.statTypes },
  ];

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: r.metaTitle, path: localizePath(locale, "/referanslar") },
          ])
        )}
      />

      <ProductsHero
        eyebrow={r.metaTitle}
        crumbs={[{ label: d.common.home, href: "/" }, { label: r.metaTitle }]}
        title={r.heroTitle}
        description={r.heroDescription}
        chips={[]}
      />

      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-3 gap-3 sm:gap-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-white p-4 text-center shadow-sm sm:p-6">
                <dd className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">{s.value}</dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>

          <SectionHeading eyebrow={r.listEyebrow} title={r.listTitle} className="mb-10 mt-14" />

          <ReferenceList items={items} />
        </div>
      </section>

      <FinalCta />
    </main>
  );
}
