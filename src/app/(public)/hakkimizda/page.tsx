import type { Metadata } from "next";
import Image from "next/image";
import { Cog, KeyRound, Ruler, ShieldCheck, Trophy, Users, type LucideIcon } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { CORPORATE_FEATURES } from "@/content/corporate";
import { ProductsHero } from "@/components/public/products-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { Intro } from "@/components/home/intro";
import { Capabilities } from "@/components/home/capabilities";
import { FinalCta } from "@/components/home/final-cta";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({ title: d.about.metaTitle, description: d.about.metaDescription, path: "/hakkimizda", locale });
}

const ICONS: Record<(typeof CORPORATE_FEATURES)[number]["icon"], LucideIcon> = {
  ruler: Ruler,
  users: Users,
  cog: Cog,
  shield: ShieldCheck,
  key: KeyRound,
  trophy: Trophy,
};

/**
 * Hakkımızda — ana sayfadaki "Kurumsal" bölümünün alanlarıyla kuruldu: mavi başlık bandı, halka bölümü (rozet + başlık +
 * paragraf + marka simgeli dönen halka), fabrika fotoğrafı + 6 özellik kartı, Yetkinlikler ve son CTA.
 * İçerik eski sitenin Kurumsal sayfasındaki gerçek cümlelerdir.
 */
export default async function AboutPage() {
  const { locale, d } = await getI18n();
  const a = d.about;
  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: a.crumb, path: localizePath(locale, "/hakkimizda") },
          ])
        )}
      />

      <ProductsHero
        eyebrow={a.eyebrow}
        crumbs={[{ label: d.common.home, href: "/" }, { label: a.crumb }]}
        title={d.common.siteName}
        description={d.footer.positioning}
        chips={[]}
      />

      <Intro showCta={false} />

      <section className="bg-background py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading align="center" eyebrow={a.eyebrow} title={a.featuresTitle} className="mb-14" />

          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="relative lg:col-span-5">
              <div className="relative h-full min-h-72 overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="/images/about/mezbaha-teknolojileri-fabrika.webp"
                  alt={a.factoryAlt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div
                aria-hidden="true"
                className="float-y absolute -start-2 -top-3 z-10 size-14 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 sm:-start-4 sm:-top-5 sm:size-16 lg:size-20"
              >
                <Image src="/images/about/icon-hooks-transparent.webp" alt="" width={480} height={480} className="size-full object-contain" />
              </div>
              <div
                aria-hidden="true"
                className="float-y-alt absolute -bottom-3 -end-2 z-10 size-14 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 sm:-bottom-5 sm:-end-4 sm:size-16 lg:size-20"
              >
                <Image src="/images/about/icon-conveyor-transparent.webp" alt="" width={480} height={480} className="size-full object-contain" />
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7">
              {CORPORATE_FEATURES.map(({ icon }, i) => {
                const Icon = ICONS[icon];
                const { title, description } = a.features[i];
                return (
                  <li
                    key={title}
                    className="group flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded border border-orange-200 bg-orange-50 text-accent">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <Capabilities />
      <FinalCta />
    </main>
  );
}
