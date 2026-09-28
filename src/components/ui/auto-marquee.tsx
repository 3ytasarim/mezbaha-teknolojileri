"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDict } from "@/components/i18n/locale-provider";

const SPEED = 55; // px/sn

/**
 * Kesintisiz akan yatay şerit (ana sayfadaki referans projeler ve seçilmiş ekipmanlar için ortak).
 * Öğeler iki kez dizilir; kaydırma konumu bir grup genişliğine ulaşınca başa sarılır (son öğeden sonra doğrudan ilk öğe,
 * boşluk yok). Fare/odak/dokunma sırasında durur, çekilince kaldığı yerden akar. Sağ/sol oklar ve noktalar bir öğe
 * kaydırır. "Hareketi azalt" tercihinde otomatik akış yoktur, elle gezilir.
 */
export function AutoMarquee({
  items,
  label,
  reverse = false,
  arrows = true,
  dots = true,
}: {
  items: ReactNode[];
  label: string;
  /** true: sağdan sola değil, soldan sağa akar (öğeler soldan çıkıp sağda kaybolur) */
  reverse?: boolean;
  arrows?: boolean;
  dots?: boolean;
}) {
  const d = useDict().common;
  const galleryRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const busyUntil = useRef(0);
  const pos = useRef(0);
  const started = useRef(false);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const metrics = useCallback(() => {
    const gallery = galleryRef.current;
    const group = groupRef.current;
    const cards = group?.children;
    if (!gallery || !group || !cards || cards.length < 2) return null;
    const step = (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft;
    return { gallery, step, groupWidth: group.offsetWidth };
  }, []);

  // Otomatik akış + sarma + aktif nokta
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let lastActive = -1;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      const m = metrics();
      if (m) {
        const { gallery, step, groupWidth } = m;
        // Ters yönde başlangıç ikinci kopyanın başıdır (geriye akınca boşluk kalmaz)
        if (reverse && !started.current) {
          started.current = true;
          gallery.scrollLeft = groupWidth;
          pos.current = groupWidth;
        }
        const busy = now < busyUntil.current;
        // Kullanıcı (parmak/tekerlek/ok) kaydırdıysa konumu ondan al
        if (busy || Math.abs(gallery.scrollLeft - Math.round(pos.current)) > 1) pos.current = gallery.scrollLeft;
        if (!busy && !paused.current && !reduced) {
          pos.current += (reverse ? -SPEED : SPEED) * dt;
          gallery.scrollLeft = pos.current;
        }
        if (reverse ? pos.current <= 1 : pos.current >= groupWidth) {
          pos.current += reverse ? groupWidth : -groupWidth;
          gallery.scrollLeft = pos.current;
        }
        const index = Math.round((gallery.scrollLeft % groupWidth) / step) % items.length;
        if (index !== lastActive) {
          lastActive = index;
          setActive(index);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [items.length, metrics, reduced, reverse]);

  const goTo = useCallback(
    (index: number, dir?: 1 | -1) => {
      const m = metrics();
      if (!m) return;
      const { gallery, step, groupWidth } = m;
      busyUntil.current = performance.now() + 800;
      // Sola giderken başta isek görünümü özdeş ikinci kopyaya taşı
      if (gallery.scrollLeft < step * 0.5 && dir === -1) gallery.scrollLeft += groupWidth;
      gallery.scrollTo({ left: index * step, behavior: reduced ? "auto" : "smooth" });
    },
    [metrics, reduced]
  );

  const move = (dir: 1 | -1) => {
    const m = metrics();
    if (!m) return;
    goTo(Math.round(m.gallery.scrollLeft / m.step) + dir, dir);
  };

  const pause = () => (paused.current = true);
  const resume = () => (paused.current = false);

  const arrow =
    "absolute top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-primary shadow-[0_8px_30px_rgba(3,19,47,0.18)] backdrop-blur-md transition duration-300 hover:scale-110 hover:bg-primary hover:text-white focus-visible:scale-110 sm:flex";

  const renderGroup = (hidden: boolean) =>
    items.map((item, index) => (
      <div key={`${hidden ? "b" : "a"}-${index}`} className="flex shrink-0">
        {item}
      </div>
    ));

  return (
    <>
      <div
        className="relative"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) resume();
        }}
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
      >
        {arrows && (
          <>
        <button type="button" onClick={() => move(-1)} className={`${arrow} start-3 md:start-6`}>
          <ChevronLeft className="h-6 w-6 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only">{d.previous}</span>
        </button>
        <button type="button" onClick={() => move(1)} className={`${arrow} end-3 md:end-6`}>
          <ChevronRight className="h-6 w-6 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only">{d.next}</span>
        </button>
          </>
        )}

        <div
          ref={galleryRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          className="overflow-x-auto pb-5 [mask-image:linear-gradient(to_right,transparent,#000_4%,#000_96%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max">
            <div ref={groupRef} className="flex gap-5 pe-5">
              {renderGroup(false)}
            </div>
            {/* Boşluksuz döngü için özdeş kopya; ekran okuyucu ve klavyeden gizli */}
            <div className="flex gap-5 pe-5" aria-hidden="true" inert>
              {renderGroup(true)}
            </div>
          </div>
        </div>
      </div>

      {dots && (
      <div className="mx-auto mt-5 flex max-w-7xl justify-center px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-full bg-white/85 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-current={active === index ? "true" : undefined}
              onClick={() => goTo(index)}
              className="flex h-6 min-w-6 items-center justify-center px-0.5"
            >
              <span className="sr-only">
                {index + 1} / {items.length}
              </span>
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all ${active === index ? "w-7 bg-primary" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
              />
            </button>
          ))}
        </div>
      </div>
      )}
    </>
  );
}
