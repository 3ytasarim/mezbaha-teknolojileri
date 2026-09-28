import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { rich } from "@/lib/i18n/rich";

import { breadcrumbListJsonLd, breadcrumbId, jsonLdScriptProps, serviceJsonLd, webPageGraphJsonLd } from "@/lib/seo/json-ld";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { getServicePageBySlug, getLocaleSlugs } from "@/lib/queries";
import { entityAlternates } from "@/lib/i18n/alternates";
import { deriveDescription } from "@/lib/seo/describe";
import { SectionHeading } from "@/components/public/section-heading";

export async function generateMetadata({ params }: PageProps<"/hizmetler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const page = await getServicePageBySlug(slug, locale);
  const translation = page?.translations[0];
  if (!page || !translation) return {};

  return buildMetadata({
    title: translation.seoTitle || translation.title,
    // Kaynakta meta description yoksa gerçek metnin ilk cümlelerinden türetilir (DB'ye yazılmaz).
    description: translation.seoDescription || deriveDescription(translation.content),
    path: `/hizmetler/${slugOf(page, locale)}`,
    ogImage: translation.ogImage || undefined,
    locale,
    alternates: entityAlternates("/hizmetler", await getLocaleSlugs("page", page.id, page.slug)) ?? false,
  });
}

export default async function ServiceDetailPage({ params }: PageProps<"/hizmetler/[slug]">) {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const sv = d.services;
  const page = await getServicePageBySlug(slug, locale);
  const translation = page?.translations[0];
  if (!page || !translation) notFound();
  const pageSlug = slugOf(page, locale);
  const servicePath = localizePath(locale, `/hizmetler/${pageSlug}`);

  const description = translation.seoDescription || deriveDescription(translation.content);
  // Bu hizmet için özel bir görsel alanı yok — yalnızca translation.ogImage doluysa (gerçek veri) primaryImageOfPage üretilir.
  const serviceImageMeta = translation.ogImage ? await getLocalImageMeta(translation.ogImage) : null;

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: sv.metaTitle, path: localizePath(locale, "/hizmetler") },
            { name: translation.title, path: servicePath },
          ])
        )}
      />
      <script {...jsonLdScriptProps(serviceJsonLd({ name: translation.title, description, path: servicePath, locale }))} />
      <script
        {...jsonLdScriptProps(
          webPageGraphJsonLd({
            path: servicePath,
            name: translation.title,
            description,
            locale,
            breadcrumbId: breadcrumbId(servicePath),
            primaryImage: translation.ogImage
              ? { url: translation.ogImage, name: translation.title, ...(serviceImageMeta ? { dimensions: serviceImageMeta } : {}) }
              : undefined,
          })
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <Link href="/hizmetler" className="hover:text-foreground">{sv.metaTitle}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{translation.title}</span>
      </nav>

      <article className="mt-6 max-w-3xl">
        <SectionHeading as="h1" eyebrow={sv.eyebrow} title={translation.title} />

        {translation.content && (
          <div
            className="prose prose-neutral mt-8 max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: translation.content }}
          />
        )}

        <p className="mt-12 text-sm text-muted-foreground">
          {rich(sv.cta, {
            contact: (
              <Link href="/iletisim" className="font-semibold text-foreground underline underline-offset-4">
                {sv.contactUs}
              </Link>
            ),
          })}
        </p>
      </article>
    </main>
  );
}
