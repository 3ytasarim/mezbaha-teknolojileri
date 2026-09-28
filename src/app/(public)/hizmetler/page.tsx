import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getServicePages } from "@/lib/queries";
import { firstParagraphText } from "@/lib/seo/describe";
import { SectionHeading } from "@/components/public/section-heading";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({ title: d.services.metaTitle, description: d.services.metaDescription, path: "/hizmetler", locale });
}

export default async function ServicesPage() {
  const { locale, d } = await getI18n();
  const sv = d.services;
  const pages = await getServicePages(locale);

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: sv.metaTitle, path: localizePath(locale, "/hizmetler") },
          ])
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{sv.metaTitle}</span>
      </nav>

      <SectionHeading as="h1" className="mt-6" eyebrow={sv.eyebrow} title={sv.metaTitle} />

      <ul className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {pages.map((page) => {
          const translation = page.translations[0];
          if (!translation) return null;
          return (
            <li key={page.id} className="border border-border p-6">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                <Link href={`/hizmetler/${slugOf(page, locale)}`} className="hover:text-primary">
                  {translation.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{firstParagraphText(translation.content)}</p>
              <Link
                href={`/hizmetler/${slugOf(page, locale)}`}
                className="mt-4 inline-flex text-sm font-semibold text-foreground underline underline-offset-4"
              >
                {sv.readMore}
                <span className="sr-only"> — {translation.title}</span>
              </Link>
            </li>
          );
        })}
        {pages.length === 0 && <li className="text-sm text-muted-foreground">{sv.empty}</li>}
      </ul>
    </main>
  );
}
