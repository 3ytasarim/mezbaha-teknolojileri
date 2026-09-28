import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { isPageAvailable } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDisplayCategories } from "@/lib/content-fallback";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";
import { SectionHeading } from "@/components/public/section-heading";

/**
 * "Ürün Kategorileri" — 21st.dev "Feature 72" (shadcnblocks) düzeni, bileşenin herkese açık önizleme paketinden
 * okunup taşındı: solda başlık + açıklama + ok bağlantısı, altında 2 sütunlu büyük kartlar (16:9 görsel üstte,
 * geniş iç boşluklu başlık + açıklama). Kaynaktaki simge görselleri yerine kategorilerin gerçek fotoğrafları,
 * kartlar kategori sayfasına bağlanır. Metin ve görseller veritabanındaki gerçek kategorilerdir.
 */
export async function ProductCategories() {
  const locale = await getLocale();
  if (!isPageAvailable(locale, "/urunler")) return null;
  const d = getDictionary(locale).home;
  const categories = await getDisplayCategories(locale);

  return (
    <section id="urunler" className="bg-background py-20 lg:py-28">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:gap-16 lg:px-16">
        <div>
          <SectionHeading
            eyebrow={d.categories.eyebrow}
            title={d.categories.title}
            description={d.categories.description}
          />
          <div className="mt-6">
            <ArrowFillButton href="/urunler" tone="navy">
              {d.categories.seeAll}
            </ArrowFillButton>
          </div>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={category.href}
                className="group flex h-full flex-col overflow-clip rounded-xl border border-border bg-white transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  {category.image && (
                    <Image
                      src={category.image}
                      alt={category.imageAlt}
                      fill
                      sizes="(min-width: 1280px) 560px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
                  <h3 className="mb-3 font-heading text-xl font-bold tracking-tight text-foreground md:mb-4 md:text-2xl lg:mb-5">
                    {category.name}
                  </h3>
                  <p className="flex-1 text-muted-foreground lg:text-lg">{category.shortDescription}</p>
                  <span className="mt-6 inline-flex items-center text-base font-semibold text-primary">
                    {d.categories.view}
                    <ArrowRight className="ms-2 size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
