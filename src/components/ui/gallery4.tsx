"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * 21st.dev "Gallery With Image Cards" (shadcnblocks.com / gallery4) — kaynak, bileşenin herkese açık
 * önizleme paketinden okunup taşındı: başlık + açıklama + ok düğmeleri, embla slaytı (mobilde dragFree),
 * tam yükseklikte görsel kartlar (hover'da yakınlaşma, gradyan üstünde başlık/açıklama/"devamı" oku),
 * altta nokta göstergeleri; 2xl ekranda soldan hizalama hilesi.
 *
 * Uyarlamalar: shadcn Carousel/Button sarmalayıcıları yerine doğrudan embla + düz butonlar; renkler sitenin
 * lacivert `primary` tonu; kartlar dış bağlantı olabilir (`external`); nokta düğmelerinin dokunma alanı büyütüldü;
 * klavye (←/→) desteği ve carousel/slide ARIA rolleri korunur.
 */
export type Gallery4Item = {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
  cta?: string;
  external?: boolean;
};

export type Gallery4Props = {
  title: string;
  description?: string;
  items: Gallery4Item[];
  /** Başlığın yanındaki "Tümü" bağlantısı. */
  allLink?: { href: string; label: string };
};

const EMBLA_OPTIONS = { axis: "x" as const, breakpoints: { "(max-width: 768px)": { dragFree: true } } };

export function Gallery4({ title, description, items, allLink }: Gallery4Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
      setCurrent(emblaApi.selectedScrollSnap());
    };
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi?.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi?.scrollNext();
      }
    },
    [emblaApi]
  );

  const arrowClass =
    "flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/5 disabled:pointer-events-auto disabled:opacity-40";

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-6 md:mb-14 lg:mb-16">
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">{title}</h2>
            {description && <p className="max-w-lg text-muted-foreground">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {allLink && (
              <a
                href={allLink.href}
                className="hidden h-11 items-center rounded-md px-3 text-sm font-semibold text-primary underline-offset-4 hover:underline sm:inline-flex"
              >
                {allLink.label}
              </a>
            )}
            <div className="hidden gap-2 md:flex">
              <button type="button" onClick={() => emblaApi?.scrollPrev()} disabled={!canScrollPrev} className={arrowClass}>
                <ArrowLeft className="size-5" aria-hidden="true" />
                <span className="sr-only">Önceki</span>
              </button>
              <button type="button" onClick={() => emblaApi?.scrollNext()} disabled={!canScrollNext} className={arrowClass}>
                <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
                <span className="sr-only">Sonraki</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={title}
          className="relative"
          onKeyDownCapture={onKeyDown}
        >
          <div ref={emblaRef} className="overflow-hidden">
            <div className="ms-0 flex 2xl:ms-[max(8rem,calc(50vw-700px))] 2xl:me-[max(0rem,calc(50vw-700px))]">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${items.length}`}
                  className="min-w-0 max-w-[320px] shrink-0 grow-0 basis-full ps-[20px] lg:max-w-[360px]"
                >
                  <a
                    href={item.href}
                    className="group rounded-xl"
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <div className="group relative h-full min-h-[27rem] max-w-full overflow-hidden rounded-xl md:aspect-[5/4] lg:aspect-[16/9]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt=""
                        loading={index < 2 ? "eager" : "lazy"}
                        className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 h-full bg-[linear-gradient(rgba(35,48,95,0),rgba(35,48,95,0.4),rgba(35,48,95,0.85)_100%)] mix-blend-multiply" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-white md:p-8">
                        <div className="mb-2 pt-4 text-xl font-semibold md:mb-3">{item.title}</div>
                        <div className="mb-8 line-clamp-2 md:mb-12 lg:mb-9">{item.description}</div>
                        <div className="flex items-center text-sm">
                          {item.cta ?? "Devamı"}
                          <ArrowRight className="ms-2 size-5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" aria-hidden="true" />
                          {item.external && <span className="sr-only"> (yeni sekmede açılır)</span>}
                          <span className="sr-only"> — {item.title}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Slayt ${index + 1} / ${items.length}`}
              aria-current={current === index ? "true" : undefined}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={`h-2 w-2 rounded-full transition-colors ${current === index ? "bg-primary" : "bg-primary/20"}`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
