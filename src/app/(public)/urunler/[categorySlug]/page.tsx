import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { rich } from "@/lib/i18n/rich";

import { breadcrumbListJsonLd, breadcrumbId, webPageGraphJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { getContactSettings, whatsappOf } from "@/lib/site-settings";
import { getCategoryBySlug, getCategoryListing, getPublishedProductsByCategory, getLocaleSlugs } from "@/lib/queries";
import { entityAlternates } from "@/lib/i18n/alternates";
import { ProductGrid } from "@/components/public/product-grid";
import { ProductsHero } from "@/components/public/products-hero";

export async function generateMetadata({
  params,
}: PageProps<"/urunler/[categorySlug]">): Promise<Metadata> {
  const { categorySlug } = await params;
  const { locale } = await getI18n();
  const category = await getCategoryBySlug(categorySlug, locale);
  if (!category) return {};

  const translation = category.translations[0];

  return buildMetadata({
    title: translation?.seoTitle || translation?.name || category.slug,
    description: translation?.seoDescription || translation?.shortDescription || "",
    path: `/urunler/${slugOf(category, locale)}`,
    ogImage: category.image || undefined,
    locale,
    alternates: entityAlternates("/urunler", await getLocaleSlugs("category", category.id, category.slug)) ?? false,
  });
}

export default async function CategoryDetailPage({
  params,
}: PageProps<"/urunler/[categorySlug]">) {
  const { categorySlug } = await params;
  const { locale, d } = await getI18n();
  const p = d.products;
  const category = await getCategoryBySlug(categorySlug, locale);
  if (!category) notFound();

  const translation = category.translations[0];
  const [products, categories] = await Promise.all([getPublishedProductsByCategory(category.id, locale), getCategoryListing(locale)]);
  const siteUrl = getSiteUrl();
  const whatsappDigits = whatsappOf(await getContactSettings()).digits;
  const name = translation?.name ?? category.slug;
  const categoryPath = localizePath(locale, `/urunler/${slugOf(category, locale)}`);
  const categoryImageMeta = category.image ? await getLocalImageMeta(category.image) : null;

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: p.metaTitle, path: localizePath(locale, "/urunler") },
            { name: name, path: categoryPath },
          ])
        )}
      />
      <script
        {...jsonLdScriptProps(
          webPageGraphJsonLd({
            path: categoryPath,
            name,
            description: translation?.description || translation?.shortDescription || undefined,
            locale,
            breadcrumbId: breadcrumbId(categoryPath),
            primaryImage: category.image
              ? { url: category.image, name, ...(categoryImageMeta ? { dimensions: categoryImageMeta } : {}) }
              : undefined,
          })
        )}
      />

      {/* Ürünler sayfasıyla aynı başlık bandı ve kart; kategori sayfasında filtre paneli yok */}
      <ProductsHero
        crumbs={[{ label: d.common.home, href: "/" }, { label: p.metaTitle, href: "/urunler" }, { label: name }]}
        title={name}
        description={translation?.description || translation?.shortDescription || undefined}
        chips={categories.map((c) => ({
          label: c.translations[0]?.name ?? c.slug,
          href: `/urunler/${slugOf(c, locale)}`,
          active: c.id === category.id,
        }))}
      />

      <section className="bg-background py-12 lg:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <ProductGrid
              siteUrl={siteUrl}
              whatsappDigits={whatsappDigits}
              items={products.map((product) => {
                const t = product.translations[0];
                return {
                  slug: slugOf(product, locale),
                  name: t?.name ?? product.slug,
                  shortDescription: t?.shortDescription,
                  image: product.coverImage,
                  imageAlt: t?.imageAlt || t?.name || product.slug,
                };
              })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{p.categoryEmpty}</p>
          )}

          <p className="mt-16 max-w-2xl text-sm text-muted-foreground">
            {rich(p.categoryBrowse, {
              products: <Link href="/urunler" className="font-semibold text-foreground underline underline-offset-4">{p.productsLink}</Link>,
            })}
          </p>
        </div>
      </section>
    </main>
  );
}
