import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { AutoMarquee } from "@/components/ui/auto-marquee";
import { getLocale } from "@/lib/i18n/server";
import { isPageAvailable } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDisplayFeaturedProducts } from "@/lib/content-fallback";

type Product = Awaited<ReturnType<typeof getDisplayFeaturedProducts>>[number];

/**
 * "Seçilmiş Ekipmanlar" — ilk tasarımdaki sade kart (4:3 görsel, kategori etiketi, başlık, kısa açıklama), tek şeritte
 * kesintisiz akar (AutoMarquee). Ürün görselleri farklı oranlarda olduğu için kırpılmaz (object-contain); beyaz zemin
 * kart zemininde `mix-blend-multiply` ile erir. Metin ve görseller veritabanındaki gerçek ürünlerdir.
 */
function renderCard(product: Product, viewLabel: string) {
  return (
    <Link key={product.href} href={product.href} className="group block w-[min(80vw,400px)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image && (
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 640px) 400px, 80vw"
            className="object-contain object-center mix-blend-multiply transition-transform duration-500 [transition-timing-function:var(--ease-industrial)] group-hover:scale-105"
          />
        )}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-accent">{product.categoryName}</p>
      <h3 className="mt-1.5 font-heading text-lg font-bold tracking-tight text-foreground">{product.name}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
      <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
        {viewLabel}
        <ArrowRight className="ms-1.5 size-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" aria-hidden="true" />
      </span>
    </Link>
  );
}

export async function FeaturedProducts() {
  const locale = await getLocale();
  if (!isPageAvailable(locale, "/urunler")) return null;
  const d = getDictionary(locale).home;
  const products = await getDisplayFeaturedProducts(locale);

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-(--container-wide) px-4 pt-20 sm:px-6 lg:px-10 lg:pt-28">
        <SectionHeading
          eyebrow={d.featured.eyebrow}
          title={d.featured.title}
          description={d.featured.description}
        />
      </div>

      <div className="pb-20 pt-12 lg:pb-28">
        <AutoMarquee label={d.featured.aria} items={products.map((p) => renderCard(p, d.featured.view))} dots={false} />
      </div>
    </section>
  );
}
