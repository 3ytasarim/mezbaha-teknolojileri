import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { format } from "@/lib/i18n/dictionaries";
import { rich } from "@/lib/i18n/rich";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getCatalogBySlug, getCatalogs } from "@/lib/legacy-content";
import { CatalogViewer } from "@/components/catalog/catalog-viewer";
import { SectionHeading } from "@/components/public/section-heading";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCatalogs().map((catalog) => ({ slug: catalog.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kataloglar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const catalog = getCatalogBySlug(slug);
  if (!catalog) return {};

  return buildMetadata({
    title: catalog.title,
    description: format(d.catalogs.detailMetaDescription, { title: catalog.title, n: String(catalog.pageCount) }),
    path: `/kataloglar/${catalog.slug}`,
    ogImage: catalog.cover.path,
    locale,
  });
}

export default async function CatalogDetailPage({ params }: PageProps<"/kataloglar/[slug]">) {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const c = d.catalogs;
  const catalog = getCatalogBySlug(slug);
  if (!catalog) notFound();

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: c.metaTitle, path: localizePath(locale, "/kataloglar") },
            { name: catalog.title, path: localizePath(locale, `/kataloglar/${catalog.slug}`) },
          ])
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <Link href="/kataloglar" className="hover:text-foreground">{c.metaTitle}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{catalog.title}</span>
      </nav>

      <SectionHeading as="h1" className="mt-6" eyebrow={c.detailEyebrow} title={catalog.title} />
      <p className="mt-4 max-w-2xl text-muted-foreground">
        {rich(format(c.detailIntro, { n: String(catalog.pageCount) }), {
          products: <Link href="/urunler" className="font-semibold text-foreground underline underline-offset-4">{c.productPages}</Link>,
          contact: <Link href="/iletisim" className="font-semibold text-foreground underline underline-offset-4">{c.contactUs}</Link>,
        })}
      </p>

      <CatalogViewer catalog={catalog} />
    </main>
  );
}
