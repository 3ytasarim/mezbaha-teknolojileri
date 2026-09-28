"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { format } from "@/lib/i18n/dictionaries";
import { useDict } from "@/components/i18n/locale-provider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";

export type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  imageAlt: string;
  /** "cover": fotoğraf sağ yarıyı doldurur; "contain": ürün banner'ı kırpılmadan gösterilir. */
  fit: "cover" | "contain";
};

const AUTOPLAY_MS = 5500;

/**
 * Norm-Yacht (Home.tsx HeroSlider) ile aynı düzen: h-[600px], solda metin bloğu (max-w-xl),
 * sağ yarıda görsel (md+), yuvarlak önceki/sonraki düğmeleri, sol altta nokta göstergesi,
 * 5,5 sn otomatik geçiş. Ek (erişilebilirlik): fare/odak üzerindeyken ve prefers-reduced-motion
 * durumunda otomatik geçiş durur.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const d = useDict().home.hero;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [changed, setChanged] = useState(false); // ilk yüklemede giriş animasyonu yok (LCP)
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;
  const go = useCallback((v: number | ((p: number) => number)) => {
    setChanged(true);
    setCurrent(v);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return;
    const id = setInterval(() => go((p) => (p + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused, reducedMotion, go]);

  const prev = useCallback(() => go((p) => (p - 1 + count) % count), [count, go]);
  const next = useCallback(() => go((p) => (p + 1) % count), [count, go]);

  const slide = slides[current];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={d.region}
      className="relative isolate overflow-hidden pb-16 md:h-[600px] md:pb-0 lg:h-[700px] xl:h-[760px] bg-gradient-to-br from-[#16204a] via-primary to-[#2f3f7d]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* site laciverti zemin: sol altta hafif turuncu parıltı */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -start-24 -z-10 size-[28rem] rounded-full blob-accent opacity-40" />

      <div className="relative z-10 flex items-center py-10 md:h-full md:py-0">
        <div className="w-full px-6 md:w-1/2 md:px-10 lg:ps-24 lg:pe-28">
          <div className="max-w-xl" aria-live={paused ? "polite" : "off"}>
            {/* Sayfanın tek H1'i her zaman DOM'da (slayt değişse de): ilk slaytın başlığı. Görünen başlıklar H1 değildir. */}
            <h1 className="sr-only">{slides[0].title}</h1>
            <p
              key={`title-${slide.id}`}
              aria-hidden={current === 0 ? "true" : undefined}
              className="mb-5 font-heading text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl"
            >
              {slide.title}
            </p>
            {slide.subtitle && (
              <p key={`sub-${slide.id}`} className="mb-8 max-w-lg text-base leading-relaxed text-gray-300 md:text-lg">
                {slide.subtitle}
              </p>
            )}
            <ArrowFillButton href={slide.buttonLink} size="lg" tone="light" srHint={`— ${slide.title}`}>
              {slide.buttonText}
            </ArrowFillButton>
          </div>
        </div>
      </div>

      {/* Görsel: mobilde metnin altında, md+ sağ yarıda */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80 md:absolute md:inset-y-0 md:end-0 md:h-auto md:w-1/2">
        <div key={`img-${slide.id}`} className={`${changed ? "hero-slide-in " : ""}relative h-full w-full ${slide.fit === "contain" ? "bg-white" : ""}`}>
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            // Yalnızca ilk (LCP) slayt gerçekten preload edilir: `priority`, Next'in kendi <link rel="preload">
            // enjeksiyonunu tetikler (manuel fetchPriority/loading bunu yapmaz). Diğer slaytlar lazy kalır.
            priority={current === 0}
            className={slide.fit === "contain" ? "object-contain p-6" : "object-cover object-right"}
          />
        </div>
        {slide.fit === "cover" && (
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-primary via-transparent to-transparent opacity-40" />
        )}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={d.prev}
            className="absolute bottom-2 end-20 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 md:bottom-3 text-white transition-colors hover:bg-accent md:end-[calc(50%+4.5rem)] lg:bottom-auto lg:start-4 lg:end-auto lg:top-1/2 lg:-translate-y-1/2"
          >
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={d.next}
            className="absolute bottom-2 end-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 md:bottom-3 text-white transition-colors hover:bg-accent md:end-[calc(50%+1rem)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
          >
            <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </button>

          <div className="absolute bottom-5 start-6 z-20 flex gap-2 md:bottom-6 md:start-10 lg:start-24">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={format(d.slide, { i: String(i + 1), n: String(count) })}
                aria-current={i === current ? "true" : undefined}
                className="flex h-6 min-w-6 items-center justify-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? "w-8 bg-accent-light" : "w-3 bg-white/40 hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
