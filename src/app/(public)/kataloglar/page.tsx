import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { format } from "@/lib/i18n/dictionaries";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getCatalogs } from "@/lib/legacy-content";
import { SectionHeading } from "@/components/public/section-heading";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({ title: d.catalogs.metaTitle, description: d.catalogs.metaDescription, path: "/kataloglar", locale });
}

export default async function CatalogsPage() {
  const { locale, d } = await getI18n();
  const c = d.catalogs;
  const catalogs = getCatalogs();

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: c.metaTitle, path: localizePath(locale, "/kataloglar") },
          ])
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{c.metaTitle}</span>
      </nav>

      <SectionHeading as="h1" className="mt-6" eyebrow={c.eyebrow} title={c.metaTitle} />

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {catalogs.map((catalog) => (
          <Link key={catalog.slug} href={`/kataloglar/${catalog.slug}`} className="group block">
            <div className="relative aspect-[600/350] overflow-hidden bg-muted">
              <Image
                src={catalog.cover.path}
                alt={catalog.cover.alt || catalog.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h2 className="mt-4 font-heading text-lg font-bold tracking-tight text-foreground">{catalog.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{format(c.pages, { n: String(catalog.pageCount) })}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
