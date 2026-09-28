"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/public/product-card";
import { format } from "@/lib/i18n/dictionaries";
import { useDict } from "@/components/i18n/locale-provider";

type Item = {
  slug: string;
  name: string;
  shortDescription?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  categoryName?: string;
};

/**
 * Kategori sayfası ürün ızgarası: ilk 8 ürün görünür, "Daha Fazla Göster" her tıkta 8 ürün daha açar.
 * Ürünlerin hepsi HTML'de bulunur (arama motorları ve ekran okuyucular için); gizli olanlar `hidden` ile saklanır,
 * görselleri açılana kadar yüklenmez.
 */
export function ProductGrid({
  items,
  siteUrl,
  whatsappDigits,
  step = 8,
}: {
  items: Item[];
  siteUrl: string;
  whatsappDigits: string;
  step?: number;
}) {
  const p = useDict().products;
  const [visible, setVisible] = useState(step);
  const remaining = items.length - visible;

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <ProductCard
            key={item.slug}
            {...item}
            siteUrl={siteUrl}
            whatsappDigits={whatsappDigits}
            priority={index < 4}
            hidden={index >= visible}
            headingLevel="h2"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ))}
      </ul>

      {items.length > step && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {format(p.gridShowing, { shown: String(Math.min(visible, items.length)), total: String(items.length) })}
          </p>
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + step)}
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
            >
              {p.showMore}
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">+{Math.min(step, remaining)}</span>
              <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
