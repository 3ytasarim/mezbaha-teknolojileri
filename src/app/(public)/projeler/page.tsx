import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { Filter, Ruler, Search, Users } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { format } from "@/lib/i18n/dictionaries";
import { localizeMeasure } from "@/lib/i18n/format";
import { rich } from "@/lib/i18n/rich";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getCapacitySolutions } from "@/lib/queries";
import { youtubeId } from "@/lib/youtube";
import { ProductsHero } from "@/components/public/products-hero";
import { ProjectGallery } from "@/components/public/project-gallery";
import { Button3D } from "@/components/ui/button-3d";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import gallery from "@/content/legacy/gallery.json";
import { FinalCta } from "@/components/home/final-cta";

type SearchParams = Promise<{ tur?: string; paket?: string; ulke?: string; q?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { tur, paket, ulke, q } = await searchParams;
  const { locale, d } = await getI18n();
  const base = await buildMetadata({
    title: d.projects.metaTitle,
    description: d.projects.metaDescription,
    path: "/projeler",
    locale,
  });
  return tur || paket || ulke || q ? { ...base, robots: { index: false, follow: true } } : base;
}

const trLower = (s: string) => s.toLocaleLowerCase("tr");

function href(p: { tur?: string; paket?: string; ulke?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (p.tur) qs.set("tur", p.tur);
  if (p.paket) qs.set("paket", p.paket);
  if (p.ulke) qs.set("ulke", p.ulke);
  if (p.q) qs.set("q", p.q);
  const s = qs.toString();
  return s ? `/projeler?${s}` : "/projeler";
}

/**
 * Projeler — eski sitenin /tr/projeler/ içeriği (7 kapasite paketi: açıklama, 4 görsel, YouTube videosu) + referans projeler.
 * Solda ürünler sayfasındaki gibi FİLTRE paneli (arama, proje türü, kapasite paketi, ülke); sayfa aşağı kaydıkça panel de
 * ekranda kalır (sticky). Filtreler URL parametreleriyle sunucuda uygulanır (JavaScript gerekmez); filtreli görünümler indekslenmez.
 */
export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const { tur = "", paket = "", ulke = "", q = "" } = await searchParams;
  const { locale, d } = await getI18n();
  const p = d.projects;
  const packages = await getCapacitySolutions(locale);

  const needle = trLower(q.trim());
  const match = (text: string) => !needle || trLower(text).includes(needle);

  const shownPackages =
    tur === "referans" || ulke
      ? []
      : packages.filter((pkg) => (!paket || slugOf(pkg, locale) === paket) && match(`${pkg.translations[0]?.name ?? ""} ${pkg.translations[0]?.description ?? ""}`));

  const hasFilter = Boolean(tur || paket || ulke || q);
  const total = shownPackages.length;

  const rowLink = "flex min-h-10 items-center gap-3 rounded-md px-1 text-sm transition-colors hover:bg-muted";
  const box = (active: boolean) => (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 items-center justify-center rounded border ${active ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"}`}
    >
      {active && (
        <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-current" strokeWidth="2">
          <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: p.metaTitle, path: localizePath(locale, "/projeler") },
          ])
        )}
      />

      <ProductsHero
        eyebrow={p.metaTitle}
        crumbs={[{ label: d.common.home, href: "/" }, { label: p.metaTitle }]}
        title={p.heroTitle}
        description={p.heroDescription}
        chips={[
          { label: p.packagesTitle, href: href({ tur: "kapasite" }), active: tur === "kapasite" },
        ]}
      />

      <section className="bg-background py-12 lg:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Filtre paneli (sticky) */}
            <aside className="lg:self-stretch">
              <div className="rounded-lg border border-border bg-white p-6 shadow-md lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
                <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-foreground">
                  <Filter className="size-5" aria-hidden="true" />
                  {p.filters}
                </h2>

                <form action={localizePath(locale, "/projeler")} method="get" role="search" className="mb-6">
                  {tur && <input type="hidden" name="tur" value={tur} />}
                  {paket && <input type="hidden" name="paket" value={paket} />}
                  {ulke && <input type="hidden" name="ulke" value={ulke} />}
                  <label htmlFor="proje-ara" className="mb-2 block text-sm font-semibold text-foreground">
                    {p.searchLabel}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="proje-ara"
                      name="q"
                      type="search"
                      defaultValue={q}
                      placeholder={p.searchPlaceholder}
                      className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button type="submit" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90">
                      <Search className="size-4" aria-hidden="true" />
                      <span className="sr-only">{p.search}</span>
                    </button>
                  </div>
                </form>

                <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-foreground">{p.packageFilter}</h3>
                  <ul className="space-y-1">
                    {packages.map((pkg) => {
                      const active = paket === slugOf(pkg, locale);
                      return (
                        <li key={pkg.id}>
                          <Link href={href({ tur: "kapasite", paket: active ? "" : slugOf(pkg, locale), q })} aria-current={active ? "true" : undefined} className={rowLink}>
                            {box(active)}
                            <span className={active ? "font-semibold text-foreground" : "text-foreground"}>{pkg.translations[0]?.name ?? pkg.slug}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {hasFilter && (
                  <Link href="/projeler" className="flex h-11 w-full items-center justify-center rounded-md border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100">
                    {p.clearFilters}
                  </Link>
                )}
              </div>
            </aside>

            {/* İçerik */}
            <div className="min-w-0">
              <p className="mb-8 text-muted-foreground" aria-live="polite">
                {rich(p.showing, { total: <span className="font-semibold text-foreground">{total}</span> })}
              </p>

              {shownPackages.length > 0 && (
                <div id="kapasite-paketleri" className="scroll-mt-24">
                  <h2 className="mb-8 font-heading text-2xl font-extrabold tracking-tight text-primary md:text-3xl">{p.packagesTitle}</h2>
                  <div className="flex flex-col gap-14">
                    {shownPackages.map((pkg) => {
                      const t = pkg.translations[0];
                      const name = t?.name ?? pkg.slug;
                      const video = youtubeId(pkg.videoUrl);
                      const gallery = pkg.images.length
                        ? pkg.images.map((img) => ({ src: img.imageUrl, alt: locale === "tr" ? img.alt || format(p.imageAlt, { name }) : format(p.imageAlt, { name }), caption: locale === "tr" ? img.caption : null }))
                        : pkg.coverImage
                          ? [{ src: pkg.coverImage, alt: pkg.coverImageAlt || format(p.imageAlt, { name }), caption: null }]
                          : [];

                      return (
                        <article key={pkg.id} id={slugOf(pkg, locale)} className="scroll-mt-28">
                          <div className="flex items-center gap-5">
                            <h3 className="font-heading text-xl font-extrabold uppercase leading-tight tracking-tight text-primary md:text-2xl">
                              {format(p.packageTitle, { name })}
                            </h3>
                            <span aria-hidden="true" className="hidden h-0.5 flex-1 rounded-full bg-gradient-to-r from-accent to-accent/0 sm:block" />
                          </div>

                          <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
                            <div className="max-w-3xl">
                              {(pkg.area || pkg.capacity) && (
                                <dl className="mb-3 flex flex-wrap gap-2.5">
                                  {pkg.area && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm">
                                      <Ruler className="size-4 text-accent" aria-hidden="true" />
                                      <dt className="font-semibold text-primary">{p.area}:</dt>
                                      <dd className="text-foreground">{localizeMeasure(pkg.area, locale)}</dd>
                                    </div>
                                  )}
                                  {pkg.capacity && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm">
                                      <Users className="size-4 text-accent" aria-hidden="true" />
                                      <dt className="font-semibold text-primary">{p.capacity}:</dt>
                                      <dd className="text-foreground">{localizeMeasure(pkg.capacity, locale)}</dd>
                                    </div>
                                  )}
                                </dl>
                              )}
                              {t?.description && <p className="text-[15px] leading-relaxed text-muted-foreground">{t.description}</p>}
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-3">
                              <Button3D href={`/projeler/${slugOf(pkg, locale)}`} tone="navy" size="sm">
                                {p.detail}<span className="sr-only"> — {format(p.detailSr, { name })}</span>
                              </Button3D>
                              <Button3D href="/teklif-al" size="sm">
                                {p.quote}
                              </Button3D>
                            </div>
                          </div>

                          <div className="mt-6">
                            <ProjectGallery images={gallery} videoId={video} videoTitle={format(p.videoTitle, { name })} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {total === 0 && (
                <div className="py-16 text-center">
                  <Search className="mx-auto mb-4 size-14 text-muted-foreground" aria-hidden="true" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">{p.notFoundTitle}</h2>
                  <p className="mb-6 mt-2 text-muted-foreground">{p.notFoundText}</p>
                  <Link href="/projeler" className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                    {p.clearFilters}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!hasFilter && (
        <section aria-labelledby="galeri-baslik" className="bg-background pb-16 lg:pb-24">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center gap-6">
              <span aria-hidden="true" className="h-0.5 flex-1 bg-accent" />
              <h2 id="galeri-baslik" className="text-center font-heading text-xl font-extrabold uppercase tracking-tight text-primary sm:text-2xl">
                {p.galleryTitle}
              </h2>
              <span aria-hidden="true" className="h-0.5 flex-1 bg-accent" />
            </div>
            <p className="mx-auto mb-8 max-w-4xl text-center text-muted-foreground">
              {p.galleryText}
            </p>
            <ImageAutoSlider
              label={p.galleryAria}
              images={gallery.items.map((g, i) => ({ src: `/images/galeri/${g.file}`, alt: locale === "tr" ? g.alt : format(p.galleryImageAlt, { n: String(i + 1) }) }))}
            />
          </div>
        </section>
      )}

      <FinalCta />
    </main>
  );
}
