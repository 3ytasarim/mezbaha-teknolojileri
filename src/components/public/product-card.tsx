"use client";

import Image from "next/image";
import Link from "@/components/i18n/link";
import { ImageOff } from "lucide-react";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";
import { WhatsappQuoteButton } from "@/components/public/whatsapp-quote-button";
import { localizePath } from "@/lib/i18n/routes";
import { useDict, useLocale } from "@/components/i18n/locale-provider";

/**
 * Ürün kartı (Ürünler ve kategori sayfaları): görsel, kategori, ad, kısa açıklama, "Ürünü İncele" ve WhatsApp "Teklif İste".
 * agorarockdrill.shop ürün kartı düzeni.
 */
export function ProductCard({
  slug,
  name,
  shortDescription,
  image,
  imageAlt,
  categoryName,
  siteUrl,
  whatsappDigits,
  priority = false,
  sizes = "(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 100vw",
  hidden = false,
  headingLevel: Heading = "h3",
}: {
  slug: string;
  name: string;
  shortDescription?: string | null;
  image?: string | null;
  /** Yönetimden girilen alt metin; yoksa ürün adı */
  imageAlt?: string | null;
  categoryName?: string;
  siteUrl: string;
  whatsappDigits: string;
  priority?: boolean;
  sizes?: string;
  /** "Daha fazla göster" ile açılana kadar gizli (HTML'de kalır) */
  hidden?: boolean;
  /** Başlık hiyerarşisi için: sayfada H1'den sonra doğrudan kart geliyorsa "h2" verilir */
  headingLevel?: "h2" | "h3";
}) {
  const ui = useDict().ui;
  const locale = useLocale();
  return (
    <li hidden={hidden} className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/urun/${slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-[4/3] bg-white">
          {image ? (
            <Image src={image} alt={imageAlt || name} fill sizes={sizes} priority={priority} className="object-contain p-4" />
          ) : (
            <div className="flex size-full items-center justify-center bg-slate-50 text-slate-300">
              <ImageOff className="size-10" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col border-t border-border p-5">
        {categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{categoryName}</p>}
        <Heading className="mt-1.5 font-heading text-lg font-bold leading-snug tracking-tight text-foreground">{name}</Heading>
        {shortDescription && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{shortDescription}</p>
        )}
        <div className="mt-5 flex flex-col gap-3">
          <ArrowFillButton href={`/urun/${slug}`} fullWidth srHint={`— ${name}`}>
            {ui.viewProduct}
          </ArrowFillButton>
          <WhatsappQuoteButton productUrl={`${siteUrl}${localizePath(locale, `/urun/${slug}`)}`} productName={name} whatsappDigits={whatsappDigits} />
        </div>
      </div>
    </li>
  );
}
