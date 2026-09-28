"use client";

import { useCallback, useEffect, useState } from "react";
import { useDict } from "@/components/i18n/locale-provider";

type Props = {
  /** Kaydırılabilir sayfa listesinin (ol) id'si. */
  containerId: string;
  total: number;
};

/**
 * Katalog gezinme kontrolleri. Sayfa görselleri sunucuda render edilir (JS'siz de kaydırılabilir);
 * bu bileşen yalnızca önceki/sonraki, sayfaya git, klavye okları ve "n / toplam" göstergesini ekler.
 */
export function CatalogControls({ containerId, total }: Props) {
  const d = useDict();
  const [current, setCurrent] = useState(1);
  const [jump, setJump] = useState("");

  const container = useCallback(() => document.getElementById(containerId), [containerId]);

  const goTo = useCallback(
    (page: number) => {
      const n = Math.min(Math.max(page, 1), total);
      const target = container()?.querySelector<HTMLElement>(`[data-page="${n}"]`);
      if (!target) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "center", block: "nearest" });
    },
    [container, total]
  );

  useEffect(() => {
    const el = container();
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(Number((entry.target as HTMLElement).dataset.page));
        }
      },
      { root: el, threshold: 0.6 }
    );
    el.querySelectorAll("[data-page]").forEach((item) => observer.observe(item));

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(current - 1);
      }
    };
    el.addEventListener("keydown", onKey);

    return () => {
      observer.disconnect();
      el.removeEventListener("keydown", onKey);
    };
  }, [container, goTo, current]);

  const buttonClass =
    "inline-flex h-12 min-w-12 items-center justify-center rounded-sm border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={buttonClass} onClick={() => goTo(current - 1)} disabled={current <= 1} aria-label={d.products.prevPage}>
        ←
      </button>
      <p className="min-w-24 text-center text-sm font-semibold text-foreground" aria-live="polite">
        Sayfa {current} / {total}
      </p>
      <button type="button" className={buttonClass} onClick={() => goTo(current + 1)} disabled={current >= total} aria-label={d.products.nextPage}>
        →
      </button>

      <form
        className="ms-auto flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const n = Number(jump);
          if (Number.isFinite(n) && n >= 1) goTo(n);
        }}
      >
        <label htmlFor="catalog-jump" className="text-sm text-muted-foreground">
          Sayfaya git
        </label>
        <input
          id="catalog-jump"
          type="number"
          min={1}
          max={total}
          inputMode="numeric"
          value={jump}
          onChange={(event) => setJump(event.target.value)}
          className="h-12 w-20 rounded-sm border border-border bg-surface px-3 text-sm text-foreground"
        />
        <button type="submit" className={buttonClass}>
          Git
        </button>
      </form>
    </div>
  );
}
