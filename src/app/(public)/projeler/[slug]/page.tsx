import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { MapPin, Ruler, Users } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { format } from "@/lib/i18n/dictionaries";
import { localizeMeasure } from "@/lib/i18n/format";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getCapacitySolutions, getProjectBySlug, getLocaleSlugs } from "@/lib/queries";
import { entityAlternates } from "@/lib/i18n/alternates";
import { youtubeId } from "@/lib/youtube";
import { ProductsHero } from "@/components/public/products-hero";
import { ProjectGallery } from "@/components/public/project-gallery";
import { Button3D } from "@/components/ui/button-3d";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";

export async function generateMetadata({ params }: PageProps<"/projeler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const project = await getProjectBySlug(slug, locale);
  if (!project) return {};

  const translation = project.translations[0];

  return buildMetadata({
    title: translation?.seoTitle || translation?.name || project.slug,
    description:
      translation?.seoDescription ||
      translation?.shortDescription ||
      // Kaynakta açıklama yok: yalnızca kayıtlı gerçek alanlardan (ülke/şehir/kapasite/alan) türetilir.
      [
        format(d.projects.metaFallback, { name: translation?.name ?? project.slug }),
        project.capacity ? format(d.projects.metaCapacity, { value: localizeMeasure(project.capacity, locale) }) : "",
        project.area ? format(d.projects.metaArea, { value: localizeMeasure(project.area, locale) }) : "",
      ]
        .filter(Boolean)
        .join(" "),
    path: `/projeler/${slugOf(project, locale)}`,
    ogImage: translation?.ogImage || project.coverImage || undefined,
    locale,
    alternates: entityAlternates("/projeler", await getLocaleSlugs("project", project.id, project.slug)) ?? false,
  });
}

export default async function ProjectDetailPage({ params }: PageProps<"/projeler/[slug]">) {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const p = d.projects;
  const project = await getProjectBySlug(slug, locale);
  if (!project) notFound();
  const projectSlug = slugOf(project, locale);

  const t = project.translations[0];
  const name = t?.name ?? project.slug;
  const isPackage = project.type === "CAPACITY_SOLUTION";
  const video = youtubeId(project.videoUrl);
  const others = isPackage ? (await getCapacitySolutions(locale)).filter((p) => p.id !== project.id) : [];

  const gallery = project.images.map((img) => ({
    src: img.imageUrl,
    alt: locale === "tr" ? img.alt || `${name} projesi` : format(p.imageAlt, { name }),
    caption: locale === "tr" ? img.caption : null,
  }));

  const facts = [
    { icon: MapPin, key: "location", label: p.location, value: project.country ? `${project.country}${project.city ? ` — ${project.city}` : ""}` : "" },
    { icon: Users, key: "capacity", label: p.capacity, value: localizeMeasure(project.capacity, locale) },
    { icon: Ruler, key: "area", label: p.area, value: localizeMeasure(project.area, locale) },
  ].filter((f) => f.value && !(isPackage && f.key === "location"));

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: p.metaTitle, path: localizePath(locale, "/projeler") },
            { name: name, path: localizePath(locale, `/projeler/${projectSlug}`) },
          ])
        )}
      />

      <ProductsHero
        eyebrow={isPackage ? p.packageEyebrow : p.referenceEyebrow}
        crumbs={[{ label: d.common.home, href: "/" }, { label: p.metaTitle, href: "/projeler" }, { label: name }]}
        title={isPackage ? format(p.packageTitle, { name }) : name}
        description={t?.shortDescription && !isPackage ? t.shortDescription : undefined}
        chips={[]}
      />

      <section className="bg-background py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {facts.length > 0 && (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-accent">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="font-heading text-lg font-bold text-foreground">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              {(t?.description || t?.shortDescription) && (
                <div>
                  <h2 className="font-heading text-2xl font-extrabold tracking-tight text-primary">{p.about}</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t?.description || t?.shortDescription}</p>
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button3D href="/teklif-al">{p.quoteLong}</Button3D>
              </div>

              {project.relatedProducts.length > 0 && (
                <div className="mt-10 border-t border-border pt-8">
                  <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">{p.relatedProducts}</h2>
                  <ul className="mt-4 flex flex-col gap-2">
                    {project.relatedProducts.map((product) => (
                      <li key={product.id}>
                        <Link href={`/urun/${slugOf(product, locale)}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                          {product.translations[0]?.name ?? product.slug}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          <div className="mt-12">
            <ProjectGallery
              images={
                gallery.length > 0
                  ? gallery
                  : project.coverImage
                    ? [{ src: project.coverImage, alt: project.coverImageAlt || name, caption: null }]
                    : []
              }
              videoId={video}
              videoTitle={format(p.detailVideoTitle, { name })}
            />
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="border-t border-border bg-background py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-primary">{p.otherPackages}</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {others.map((pkg) => (
                <li key={pkg.id}>
                  <Link
                    href={`/projeler/${slugOf(pkg, locale)}`}
                    className="inline-flex h-11 items-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white"
                  >
                    {pkg.translations[0]?.name ?? pkg.slug}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ArrowFillButton href="/projeler" tone="navy">
                {p.allProjects}
              </ArrowFillButton>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
