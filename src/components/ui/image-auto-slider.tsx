"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

export type SliderImage = { src: string; alt: string };

/**
 * 21st.dev "Image Auto Slider" (waleedkibhen) — görseller soldan sağa kesintisiz akar, kenarlar yumuşakça solar, üzerine
 * gelince durur. Kaynak kod yalnızca giriş yapılınca indirilebildiği için bileşenin davranışı (görselleri iki kez dizip
 * -50% kaydıran CSS animasyonu, hover'da duraklama, kenar maskesi) yeniden yazıldı. Eklenenler: tıklayınca büyütme
 * penceresi, klavye erişimi, `prefers-reduced-motion`'da yatay elle kaydırma.
 */
export function ImageAutoSlider({ images, label }: { images: SliderImage[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const loop = [...images, ...images];

  return (
    <div role="region" aria-label={label}>
      <div className="image-slider-mask overflow-hidden motion-reduce:overflow-x-auto">
        <ul className="image-slider-track flex w-max gap-4 py-2">
          {loop.map((img, i) => {
            const dup = i >= images.length;
            return (
              <li key={`${img.src}-${i}`} aria-hidden={dup || undefined} className="shrink-0">
                <button
                  type="button"
                  tabIndex={dup ? -1 : 0}
                  onClick={() => setOpen(i % images.length)}
                  aria-label={dup ? undefined : `${img.alt} — büyüt`}
                  className="group relative block h-56 w-44 overflow-hidden rounded-2xl bg-slate-100 shadow-md transition-transform duration-300 hover:scale-[1.03] sm:h-72 sm:w-56 lg:h-80 lg:w-60"
                >
                  <Image src={img.src} alt={dup ? "" : img.alt} fill sizes="240px" className="object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition group-hover:bg-primary/30 group-hover:opacity-100">
                    <ZoomIn className="size-8 text-white" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={images[open].alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
        >
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(null)}
            aria-label="Kapat"
            className="absolute end-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-5xl">
            <Image src={images[open].src} alt={images[open].alt} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
