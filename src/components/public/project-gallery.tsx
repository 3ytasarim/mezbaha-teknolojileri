"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { format } from "@/lib/i18n/dictionaries";
import { useDict } from "@/components/i18n/locale-provider";

export type GalleryImage = { src: string; alt: string; caption?: string | null };

type Item = { kind: "image"; image: GalleryImage } | { kind: "video"; id: string; title: string };

const COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/** YouTube kapak görseli: önce yüksek çözünürlük, yoksa orta boy. */
function VideoThumb({ id, title }: { id: string; title: string }) {
  const p = useDict().projects;
  const [src, setSrc] = useState(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={format(p.videoCover, { title })}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setSrc(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`)}
      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

/**
 * Proje medyası — TEK SATIRDA yan yana (masaüstünde): görseller + video kapağı eşit kartlar olarak dizilir. Görsele tıklayınca
 * tam ekran büyütme (lightbox), video kartına tıklayınca aynı pencerede video oynar (gizlilik dostu youtube-nocookie;
 * video tıklanana kadar yüklenmez, yalnızca kapak görseli gösterilir). Klavye: ← → geçiş, Esc kapatma.
 */
export function ProjectGallery({ images, videoId, videoTitle }: { images: GalleryImage[]; videoId?: string | null; videoTitle?: string }) {
  const p = useDict().projects;
  const title = videoTitle ?? p.defaultVideoTitle;
  const items: Item[] = [...images.map((image) => ({ kind: "image" as const, image })), ...(videoId ? [{ kind: "video" as const, id: videoId, title }] : [])];

  const [open, setOpen] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus();
  }, []);
  const go = useCallback((dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, go]);

  if (items.length === 0) return null;

  const current = open !== null ? items[open] : null;

  return (
    <>
      <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 ${COLS[Math.min(items.length, 6)]}`}>
        {items.map((item, i) => {
          const isVideo = item.kind === "video";
          const label = isVideo ? format(p.play, { title: item.title }) : format(p.enlarge, { alt: item.image.alt });
          return (
            <li key={isVideo ? item.id : item.image.src} className={isVideo && items.length % 2 === 1 ? "col-span-2 sm:col-span-1" : ""}>
              <figure className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <button
                  type="button"
                  onClick={(e) => {
                    lastTrigger.current = e.currentTarget;
                    setOpen(i);
                  }}
                  className={`absolute inset-0 z-10 size-full rounded-2xl outline-offset-[-4px] ${isVideo ? "cursor-pointer" : "cursor-zoom-in"}`}
                  aria-label={label}
                />
                <div className="relative aspect-[4/3] overflow-hidden bg-primary">
                  {isVideo ? (
                    <>
                      <VideoThumb id={item.id} title={item.title} />
                      <span aria-hidden="true" className="absolute inset-0 bg-[#101838]/25 transition-colors group-hover:bg-[#101838]/10" />
                      <span aria-hidden="true" className="absolute left-1/2 top-1/2 z-20 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent shadow-[0_10px_30px_rgba(176,74,32,0.55)] ring-4 ring-white/30 transition-transform duration-300 group-hover:scale-110">
                        <Play className="ms-0.5 size-6 fill-white text-white" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span aria-hidden="true" className="absolute end-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow transition-opacity group-hover:opacity-100">
                        <ZoomIn className="size-4" />
                      </span>
                    </>
                  )}
                </div>
                <figcaption className="flex-1 border-t border-border p-4 text-sm leading-snug text-muted-foreground">
                  {isVideo ? item.title : item.image.caption || item.image.alt}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      {current && open !== null && (
        <div role="dialog" aria-modal="true" aria-label={p.media} className="fixed inset-0 z-[100] flex flex-col bg-[#0b1030]/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm text-white/80" aria-live="polite">
              {open + 1} / {items.length}
            </p>
            <button ref={closeRef} type="button" onClick={close} className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={p.close}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => e.target === e.currentTarget && close()}>
            {items.length > 1 && (
              <button type="button" onClick={() => go(-1)} aria-label={p.prev} className="absolute start-2 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:start-4">
                <ChevronLeft className="size-6 rtl:-scale-x-100" aria-hidden="true" />
              </button>
            )}
            {current.kind === "image" ? (
              <div className="relative h-full w-full">
                <Image src={current.image.src} alt={current.image.alt} fill sizes="100vw" className="object-contain" />
              </div>
            ) : (
              <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl">
                <iframe
                  key={current.id}
                  className="size-full"
                  src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&rel=0`}
                  title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            )}
            {items.length > 1 && (
              <button type="button" onClick={() => go(1)} aria-label={p.next} className="absolute end-2 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:end-4">
                <ChevronRight className="size-6 rtl:-scale-x-100" aria-hidden="true" />
              </button>
            )}
          </div>

          {current.kind === "image" && current.image.caption && <p className="px-4 py-4 text-center text-sm text-white/90">{current.image.caption}</p>}
        </div>
      )}
    </>
  );
}
