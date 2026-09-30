import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { format } from "@/lib/i18n/dictionaries";
import { rich } from "@/lib/i18n/rich";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site";
import { getContactSettings, whatsappOf } from "@/lib/site-settings";
import { getAllPublishedProducts, getCategoryListing } from "@/lib/queries";
import { resolveCoverImage } from "@/lib/product-media";
import { ProductCard } from "@/components/public/product-card";
import { ProductsHero } from "@/components/public/products-hero";

/**
 * Ürünler sayfası — agorarockdrill.shop "spare-parts" düzeni: mavi başlık bandı, solda filtre paneli (arama + kategori),
 * sağda ürün ızgarası; her ürün kartında "Ürünü İncele" ve WhatsApp "Teklif İste" düğmeleri.
 * Filtre/arama/sayfalama URL parametreleriyle (kategori, q, sayfa) SUNUCUDA yapılır: JavaScript gerekmez,
 * bağlantılar paylaşılabilir ve taranabilir. Filtreli görünümler indekslenmez, kanonik /urunler'dir.
 */
const PAGE_SIZE = 12;

type SearchParams = Promise<{ kategori?: string; q?: string; sayfa?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { kategori, q, sayfa } = await searchParams;
  const { locale, d } = await getI18n();
  const base = await buildMetadata({
    title: d.products.metaTitle,
    description: d.products.metaDescription,
    path: "/urunler",
    locale,
  });
  return kategori || q || (sayfa && sayfa !== "1") ? { ...base, robots: { index: false, follow: true } } : base;
}

const trLower = (s: string) => s.toLocaleLowerCase("tr");

function buildHref(params: { kategori?: string; q?: string; sayfa?: number }) {
  const qs = new URLSearchParams();
  if (params.kategori) qs.set("kategori", params.kategori);
  if (params.q) qs.set("q", params.q);
  if (params.sayfa && params.sayfa > 1) qs.set("sayfa", String(params.sayfa));
  const s = qs.toString();
  return s ? `/urunler?${s}` : "/urunler";
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { kategori = "", q = "", sayfa = "1" } = await searchParams;
  const { locale, d } = await getI18n();
  const p = d.products;
  const [categories, products] = await Promise.all([getCategoryListing(locale), getAllPublishedProducts(locale)]);
  const siteUrl = getSiteUrl();
  const whatsappDigits = whatsappOf(await getContactSettings()).digits;

  const needle = trLower(q.trim());
  const filtered = products.filter((product) => {
    if (kategori && slugOf(product.category, locale) !== kategori) return false;
    if (!needle) return true;
    const t = product.translations[0];
    return trLower(`${t?.name ?? ""} ${t?.shortDescription ?? ""}`).includes(needle);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(sayfa, 10) || 1), totalPages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = Boolean(kategori || q);

  return (
    <main>
      <script {...jsonLdScriptProps(breadcrumbListJsonLd([
        { name: d.common.home, path: localizePath(locale, "/") },
        { name: p.metaTitle, path: localizePath(locale, "/urunler") },
      ]))} />

      <ProductsHero
        crumbs={[{ label: d.common.home, href: "/" }, { label: p.metaTitle }]}
        title={p.heroTitle}
        description={p.heroDescription}
        chips={categories.map((category) => ({
          label: category.translations[0]?.name ?? category.slug,
          href: buildHref({ kategori: slugOf(category, locale) }),
        }))}
      />

      <section className="bg-background py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Filtre paneli */}
            <aside className="lg:col-span-1">
              <div className="rounded-lg border border-border bg-white p-6 shadow-md lg:sticky lg:top-24">
                <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-foreground">
                  <Filter className="size-5" aria-hidden="true" />
                  {p.filters}
                </h2>

                <form action={localizePath(locale, "/urunler")} method="get" role="search" className="mb-6">
                  {kategori && <input type="hidden" name="kategori" value={kategori} />}
                  <label htmlFor="urun-ara" className="mb-2 block text-sm font-semibold text-foreground">
                    {p.searchLabel}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="urun-ara"
                      name="q"
                      type="search"
                      defaultValue={q}
                      placeholder={p.searchPlaceholder}
                      className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Search className="size-4" aria-hidden="true" />
                      <span className="sr-only">{p.search}</span>
                    </button>
                  </div>
                </form>

                <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-foreground">{p.category}</h3>
                  <ul className="space-y-1">
                    {categories.map((category) => {
                      const active = slugOf(category, locale) === kategori;
                      return (
                        <li key={category.id}>
                          <Link
                            href={buildHref({ kategori: active ? undefined : slugOf(category, locale), q })}
                            aria-current={active ? "true" : undefined}
                            className="flex min-h-11 items-center gap-3 rounded-md px-1 text-sm transition-colors hover:bg-muted"
                          >
                            <span
                              aria-hidden="true"
                              className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                                active ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                              }`}
                            >
                              {active && (
                                <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-current" strokeWidth="2">
                                  <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <span className={active ? "font-semibold text-foreground" : "text-foreground"}>
                              {category.translations[0]?.name ?? category.slug}
                            </span>
                            <span className="ms-auto text-xs text-muted-foreground">{category._count.products}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {hasFilter && (
                  <Link
                    href="/urunler"
                    className="flex h-11 w-full items-center justify-center rounded-md border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                  >
                    {p.clearFilters}
                  </Link>
                )}
              </div>
            </aside>

            {/* Ürünler */}
            <div className="lg:col-span-3">
              <p className="mb-6 text-muted-foreground" aria-live="polite">
                {rich(p.showing, {
                  total: <span className="font-semibold text-foreground">{filtered.length}</span>,
                  range: (
                    <span className="font-semibold text-foreground">
                      {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + visible.length}
                    </span>
                  ),
                })}
                {totalPages > 1 && <span className="ms-2">{format(p.pageOf, { page: String(page), pages: String(totalPages) })}</span>}
              </p>

              {visible.length > 0 ? (
                <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((product) => {
                    const t = product.translations[0];
                    return (
                      <ProductCard
                        key={product.id}
                        slug={slugOf(product, locale)}
                        name={t?.name ?? product.slug}
                        shortDescription={t?.shortDescription}
                        image={resolveCoverImage(product.coverImage, t?.coverImage)}
                        imageAlt={t?.imageAlt || t?.name || product.slug}
                        categoryName={product.category.translations[0]?.name}
                        siteUrl={siteUrl}
                        whatsappDigits={whatsappDigits}
                      />
                    );
                  })}
                </ul>
              ) : (
                <div className="py-16 text-center">
                  <Search className="mx-auto mb-4 size-14 text-muted-foreground" aria-hidden="true" />
                  <h3 className="font-heading text-2xl font-bold text-foreground">{p.notFoundTitle}</h3>
                  <p className="mb-6 mt-2 text-muted-foreground">{p.notFoundText}</p>
                  <Link
                    href="/urunler"
                    className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    {p.clearAll}
                  </Link>
                </div>
              )}

              {totalPages > 1 && (
                <nav aria-label={p.pagesAria} className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={buildHref({ kategori, q, sayfa: page - 1 })}
                      rel="prev"
                      className="flex size-11 items-center justify-center rounded-md border border-border bg-white hover:bg-muted"
                    >
                      <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                      <span className="sr-only">{p.prevPage}</span>
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Link
                      key={n}
                      href={buildHref({ kategori, q, sayfa: n })}
                      aria-current={n === page ? "page" : undefined}
                      className={`flex size-11 items-center justify-center rounded-md border text-sm font-semibold ${
                        n === page
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-white text-foreground hover:bg-muted"
                      }`}
                    >
                      {n}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link
                      href={buildHref({ kategori, q, sayfa: page + 1 })}
                      rel="next"
                      className="flex size-11 items-center justify-center rounded-md border border-border bg-white hover:bg-muted"
                    >
                      <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                      <span className="sr-only">{p.nextPage}</span>
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>

          <p className="mt-16 max-w-2xl text-sm text-muted-foreground">
            {rich(p.browse, {
              catalogs: <Link href="/kataloglar" className="font-semibold text-foreground underline underline-offset-4">{p.catalogsLink}</Link>,
              videos: <Link href="/videolar" className="font-semibold text-foreground underline underline-offset-4">{p.videosLink}</Link>,
            })}
          </p>
        </div>
      </section>
    </main>
  );
}
