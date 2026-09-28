"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from "lucide-react";
import { format } from "@/lib/i18n/dictionaries";
import { useDict } from "@/components/i18n/locale-provider";

export type ProductGalleryImage = { src: string; alt: string };

/**
 * Ürün görsel galerisi (agorarockdrill ürün detay düzeni): büyük ana görsel (kırpmadan, beyaz zeminde), sol/sağ oklar
 * ve altında 4'lü küçük resim şeridi; seçili küçük resim çerçeveli. Ok tuşları ana görsel odaktayken de çalışır.
 */
export function ProductGallery({ images, name }: { images: ProductGalleryImage[]; name: string }) {
  const ui = useDict().ui;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const count = images.length;

  // Otomatik geçiş: 4 sn; fare/odak üzerindeyken, yakınlaştırma açıkken veya hareket azaltma tercihinde durur.
  useEffect(() => {
    if (count < 2 || paused || zoomOpen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 4000);
    return () => window.clearInterval(id);
  }, [count, paused, zoomOpen, index]);

  const closeZoom = useCallback(() => {
    setZoomOpen(false);
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
      if (count > 1 && e.key === "ArrowRight") { setZoomed(false); setIndex((i) => (i + 1) % count); }
      if (count > 1 && e.key === "ArrowLeft") { setZoomed(false); setIndex((i) => (i - 1 + count) % count); }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomOpen, count, closeZoom]);

  if (count === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 text-slate-300">
        <ImageOff className="size-14" aria-hidden="true" />
        <span className="text-sm text-slate-400">{ui.comingSoonImage}</span>
      </div>
    );
  }

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);
  const current = images[index];

  return (
    <div role="group" aria-roledescription="carousel" aria-label={format(ui.galleryAria, { name })}>
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-white"
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-contain p-3 transition-opacity duration-300"
        />
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={ui.zoomImage}
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="absolute end-3 top-3 flex size-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
            <ZoomIn className="size-5" aria-hidden="true" />
          </span>
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={ui.prevImage}
              className="absolute start-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-sm transition hover:scale-110 hover:bg-white"
            >
              <ChevronLeft className="size-6 rtl:-scale-x-100" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={ui.nextImage}
              className="absolute end-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-sm transition hover:scale-110 hover:bg-white"
            >
              <ChevronRight className="size-6 rtl:-scale-x-100" aria-hidden="true" />
            </button>
            <p className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-primary/85 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">
              {index + 1} / {count}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-5 grid grid-cols-4 gap-3">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={format(ui.showImage, { n: String(i + 1) })}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-20 w-full overflow-hidden rounded-xl border-2 bg-white transition-all ${
                  i === index ? "border-primary shadow-lg" : "border-transparent hover:border-slate-300"
                }`}
              >
                <Image src={image.src} alt="" fill sizes="120px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomOpen && (
        <div role="dialog" aria-modal="true" aria-label={format(ui.zoomedAria, { name })} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <button type="button" onClick={closeZoom} aria-label={ui.close} className="absolute end-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30">
            <X className="size-6" aria-hidden="true" />
          </button>
          {count > 1 && (
            <>
              <button type="button" onClick={() => { setZoomed(false); go(-1); }} aria-label={ui.prevImage} className="absolute start-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30">
                <ChevronLeft className="size-6 rtl:-scale-x-100" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => { setZoomed(false); go(1); }} aria-label={ui.nextImage} className="absolute end-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30">
                <ChevronRight className="size-6 rtl:-scale-x-100" aria-hidden="true" />
              </button>
            </>
          )}
          <div
            className={`relative h-full w-full max-w-6xl overflow-hidden rounded-xl ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              setZoomed((z) => !z);
            }}
            onMouseMove={(e) => {
              if (!zoomed) return;
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
            }}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="100vw"
              className="object-contain transition-transform duration-300 ease-out"
              style={{ transform: zoomed ? "scale(2.5)" : "scale(1)", transformOrigin: origin }}
            />
          </div>
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
            {zoomed ? "Küçültmek için tıklayın" : "Yakınlaştırmak için tıklayın"}
            {count > 1 ? ` · ${index + 1} / ${count}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
