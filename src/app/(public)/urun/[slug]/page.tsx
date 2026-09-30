import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download, Mail, Package, Phone, Tag } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { format } from "@/lib/i18n/dictionaries";

import { breadcrumbListJsonLd, breadcrumbId, productJsonLd, productId, webPageGraphJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { getProductBySlug, getRelatedProducts, getLocaleSlugs } from "@/lib/queries";
import { resolveCoverImage, resolveGalleryImageUrl } from "@/lib/product-media";
import { entityAlternates } from "@/lib/i18n/alternates";
import { getSiteUrl } from "@/lib/seo/site";
import { productWhatsappMessage, whatsappUrl } from "@/lib/whatsapp";
import { getContactSettings, whatsappOf } from "@/lib/site-settings";
import { youtubeId } from "@/lib/youtube";
import { Button3D } from "@/components/ui/button-3d";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";
import { LiteYouTube } from "@/components/ui/lite-youtube";
import { ProductGallery } from "@/components/public/product-gallery";
import { ShareButtons } from "@/components/public/share-buttons";

export async function generateMetadata({ params }: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const product = await getProductBySlug(slug, locale);
  if (!product) return {};

  const translation = product.translations[0];

  return buildMetadata({
    title: translation?.seoTitle || translation?.name || product.slug,
    description: translation?.seoDescription || translation?.shortDescription || "",
    path: translation?.canonicalUrl || `/urun/${slugOf(product, locale)}`,
    ogImage: translation?.ogImage || resolveCoverImage(product.coverImage, translation?.coverImage) || undefined,
    locale,
    alternates: entityAlternates("/urun", await getLocaleSlugs("product", product.id, product.slug)) ?? false,
  });
}

const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

/**
 * Ürün detay — agorarockdrill.shop ürün detay düzeni: üstte beyaz yol çubuğu; solda yapışkan beyaz galeri kartı (büyük görsel,
 * oklar, küçük resimler), sağda başlık + açıklama + bilgi kartı + büyük teklif düğmeleri + paylaşım + yardım kartı; altta beyaz
 * içerik bölümleri (Açıklama, Kullanım Alanları, Özellikler, Teknik Özellikler tablosu, Video, Belgeler) ve benzer ürünler.
 */
export default async function ProductDetailPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const p = d.products.detail;
  const product = await getProductBySlug(slug, locale);
  if (!product) notFound();
  const productSlug = slugOf(product, locale);
  const categorySlug = slugOf(product.category, locale);

  const t = product.translations[0];
  const name = t?.name ?? product.slug;
  const categoryTranslation = product.category.translations[0];
  const categoryName = categoryTranslation?.name ?? product.category.slug;
  const siteUrl = getSiteUrl();
  const contact = await getContactSettings();
  const whatsapp = whatsappOf(contact);
  const productUrl = `${siteUrl}${localizePath(locale, `/urun/${productSlug}`)}`;
  const video = youtubeId(product.videoUrl);
  const related = await getRelatedProducts(product.categoryId, product.id, 4, locale);

  // Kapak ve galerideki tüm görseller aynı, dile duyarlı açıklayıcı alt metni paylaşır (translation.imageAlt);
  // eski `Product.coverImageAlt` / `ProductImage.alt` alanları yalnızca Türkçedir ve burada KULLANILMAZ
  // (İngilizce vb. sayfada Türkçe alt metni sızmasın diye — bkz. docs/I18N_PLAN.md).
  const imageAlt = t?.imageAlt || name;
  const coverImage = resolveCoverImage(product.coverImage, t?.coverImage);
  const galleryImages = [
    ...(coverImage ? [{ src: coverImage, alt: imageAlt }] : []),
    ...product.images.map((img) => ({ src: resolveGalleryImageUrl(img.imageUrl, t?.galleryOverrides), alt: imageAlt })),
  ];
  const allImageUrls = galleryImages.map((g) => g.src);
  const email = contact.emails[0]?.value;
  const phone = contact.phones[0]?.value;
  const productPath = localizePath(locale, `/urun/${productSlug}`);
  const coverImageMeta = coverImage ? await getLocalImageMeta(coverImage) : null;

  return (
    <main className="bg-background">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: d.products.metaTitle, path: localizePath(locale, "/urunler") },
            { name: categoryName, path: localizePath(locale, `/urunler/${categorySlug}`) },
            { name, path: localizePath(locale, `/urun/${productSlug}`) },
          ])
        )}
      />
      <script
        {...jsonLdScriptProps(
          productJsonLd({
            name,
            description: t?.shortDescription ?? name,
            path: productPath,
            images: allImageUrls.length > 0 ? allImageUrls : [new URL("/favicon.ico", siteUrl).toString()],
            categoryName: categoryTranslation?.name,
            sku: product.sku ?? undefined,
            // Ürünlerin gerçek üreticisi/markası biziz (site içeriğinde doğrulanabilir) — uydurma brand değil.
            brandRef: true,
            locale,
          })
        )}
      />
      <script
        {...jsonLdScriptProps(
          webPageGraphJsonLd({
            path: productPath,
            name,
            description: t?.shortDescription ?? name,
            locale,
            breadcrumbId: breadcrumbId(productPath),
            mainEntityId: productId(productPath),
            primaryImage: coverImage
              ? { url: coverImage, name: imageAlt, ...(coverImageMeta ? { dimensions: coverImageMeta } : {}) }
              : undefined,
          })
        )}
      />

      {/* Yol çubuğu */}
      <div className="border-b border-border bg-background">
        <nav aria-label={d.ui.breadcrumb} className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Link href="/" className="transition-colors hover:text-primary">{d.common.home}</Link>
          <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <Link href="/urunler" className="transition-colors hover:text-primary">{d.products.metaTitle}</Link>
          <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <Link href={`/urunler/${categorySlug}`} className="transition-colors hover:text-primary">{categoryName}</Link>
          <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          <span className="max-w-xs truncate font-medium text-foreground" aria-current="page">{name}</span>
        </nav>
      </div>

      {/* Üst bölüm: galeri + bilgi */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8 lg:sticky lg:top-24">
              <ProductGallery images={galleryImages} name={name} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              {product.featured && (
                <span className="mb-3 inline-block rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-sm font-semibold text-white">
                  {p.featured}
                </span>
              )}
              <h1 className="font-heading text-2xl font-black leading-tight text-primary md:text-4xl">{name}</h1>
              {t?.shortDescription && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t.shortDescription}</p>}
            </div>

            <hr className="border-border" />

            {/* Bilgi kartı */}
            <ul className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
              <li className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Tag className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{p.category}</p>
                  <div className="mt-1">
                    <Link
                      href={`/urunler/${categorySlug}`}
                      className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2 font-semibold text-foreground transition-colors hover:bg-slate-200"
                    >
                      {categoryName}
                    </Link>
                  </div>
                </div>
              </li>
              {product.sku && (
                <li className="flex items-start gap-3 border-t border-border pt-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Package className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">{p.sku}</p>
                    <p className="mt-1 font-mono text-lg font-bold tracking-wider text-foreground">{product.sku}</p>
                  </div>
                </li>
              )}
            </ul>

            {/* Eylemler */}
            <div className="space-y-3">
              <Button3D href={`/teklif-al?urun=${productSlug}`} fullWidth size="lg">
                {p.quoteCta}
              </Button3D>
              {whatsapp.digits && (
                <a
                  href={whatsappUrl(productWhatsappMessage(productUrl, d.ui.productWhatsappMessage), whatsapp.digits)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0e7f3a] text-base font-bold text-white shadow-[0_8px_22px_rgba(14,127,58,0.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0b6a30]"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
                    <path d={WA_PATH} />
                  </svg>
                  {p.waQuote}
                  <span className="sr-only"> {d.common.opensInNewTab}</span>
                </a>
              )}
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
                <span className="text-sm font-semibold text-foreground">{p.share}</span>
                <ShareButtons url={productUrl} title={name} image={coverImage ? new URL(coverImage, siteUrl).toString() : undefined} />
              </div>
            </div>

            {/* Yardım */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <h2 className="mb-2 font-heading text-lg font-bold text-foreground">{p.helpTitle}</h2>
              <p className="mb-4 text-muted-foreground">
                {p.helpText}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {email && (
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                    <Mail className="size-4" aria-hidden="true" />
                    {email}
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                    <Phone className="size-4" aria-hidden="true" />
                    {phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* İçerik bölümleri */}
      {(t?.description || t?.applications || t?.features || product.specifications.length > 0 || video || product.documents.length > 0) && (
        <section className="border-t border-border bg-background py-16">
          <div className="mx-auto max-w-5xl space-y-14 px-4 sm:px-6 lg:px-8">
            {t?.description && (
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary">{p.descriptionH}</h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.description }} />
              </div>
            )}

            {t?.applications && (
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary">{p.applicationsH}</h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.applications }} />
              </div>
            )}

            {t?.features && (
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary">{p.featuresH}</h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.features }} />
              </div>
            )}

            {product.specifications.length > 0 && (
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary">{p.specsH}</h2>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={spec.id} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                          <th scope="row" className="w-2/5 border-b border-border px-4 py-3 text-start font-semibold text-foreground">
                            {spec.label}
                          </th>
                          <td className="border-b border-border px-4 py-3 text-muted-foreground">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {video && (
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary">{p.videoH}</h2>
                <LiteYouTube videoId={video} title={format(p.videoTitle, { name })} />
              </div>
            )}

            {product.documents.length > 0 && (
              <div>
                <h2 className="mb-4 font-heading text-2xl font-bold text-primary">{p.documentsH}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {product.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-accent">
                          <Download className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-foreground group-hover:text-primary">{doc.title}</span>
                          <span className="text-xs text-muted-foreground">PDF · {(doc.fileSize / 1024).toFixed(0)} KB</span>
                        </span>
                        <span className="sr-only">{d.common.opensInNewTab}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* İlgili projeler ve yazılar */}
      {(product.relatedProjects.length > 0 || product.relatedPosts.length > 0) && (
        <section className="border-t border-border bg-background py-14">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {product.relatedProjects.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-primary">{p.relatedProjects}</h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {product.relatedProjects.map((project) => (
                    <li key={project.id}>
                      <Link href={`/projeler/${slugOf(project, locale)}`} className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
                        {project.translations[0]?.name ?? project.slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.relatedPosts.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-primary">{p.relatedPosts}</h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {product.relatedPosts.map((post) => (
                    <li key={post.id}>
                      <Link href={`/blog/${slugOf(post, locale)}`} className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
                        {post.translations[0]?.title ?? post.slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Benzer ürünler */}
      {related.length > 0 && (
        <section className="border-t border-border bg-background py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl font-bold text-primary">{p.similarH}</h2>
            <p className="mb-8 mt-2 text-muted-foreground">{p.similarSub}</p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => {
                const rt = item.translations[0];
                const rName = rt?.name ?? item.slug;
                const rCoverImage = resolveCoverImage(item.coverImage, rt?.coverImage);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/urun/${slugOf(item, locale)}`}
                      className="group block overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative aspect-square bg-white">
                        {rCoverImage && (
                          <Image src={rCoverImage} alt={rt?.imageAlt || rName} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-4" />
                        )}
                      </div>
                      <div className="border-t border-border p-4">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{rName}</h3>
                        <span className="mt-2 inline-block text-xs font-semibold text-primary">{p.seeDetails}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-10 flex justify-center">
              <ArrowFillButton href={`/urunler/${categorySlug}`} tone="navy" size="lg">
                {format(p.seeAllIn, { category: categoryName })}
              </ArrowFillButton>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
