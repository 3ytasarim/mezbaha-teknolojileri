"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * 21st.dev "Spotlight Card" (GlowCard — EaseMize UI Registry / Hossain Jahed) — kaynak, bileşenin herkese açık
 * önizleme paketinden okunup taşındı: imleç konumunu (--x/--y/--xp/--yp) izleyen ışık lekesi, kenarlıkta parlama
 * (::before/::after katmanları — CSS `header-hero.css` içinde), imleçle kayan renk tonu (--hue = base + xp * spread).
 *
 * Uyarlamalar:
 *  - Kaynaktaki her kartta ayrı `pointermove` dinleyicisi yerine TEK ortak dinleyici + requestAnimationFrame
 *    (19 kartta performans için); ayarlanan değişkenler ve görsel sonuç aynı.
 *  - Kaynaktaki her kartta tekrarlanan <style> bloğu global CSS'e taşındı.
 *  - Marka turuncusuna uygun `brand` renk ayarı eklendi (ton 12–36, imleçle çok az kayar).
 */
const GLOW_COLORS = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
  brand: { base: 16, spread: 24 },
} as const;

const SIZE_CLASSES = { sm: "w-48 h-64", md: "w-64 h-80", lg: "w-80 h-96" } as const;

// ---- ortak imleç izleyici ----
const registry = new Set<HTMLElement>();
let listening = false;
let frame = 0;
let pointer = { x: 0, y: 0 };

function flush() {
  frame = 0;
  const { x, y } = pointer;
  const xp = (x / window.innerWidth).toFixed(2);
  const yp = (y / window.innerHeight).toFixed(2);
  registry.forEach((el) => {
    el.style.setProperty("--x", x.toFixed(2));
    el.style.setProperty("--xp", xp);
    el.style.setProperty("--y", y.toFixed(2));
    el.style.setProperty("--yp", yp);
  });
}

function onPointerMove(event: PointerEvent) {
  pointer = { x: event.clientX, y: event.clientY };
  if (!frame) frame = requestAnimationFrame(flush);
}

function register(el: HTMLElement) {
  registry.add(el);
  if (!listening) {
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    listening = true;
  }
}

function unregister(el: HTMLElement) {
  registry.delete(el);
  if (registry.size === 0 && listening) {
    document.removeEventListener("pointermove", onPointerMove);
    listening = false;
  }
}

interface GlowCardProps {
  children?: ReactNode;
  className?: string;
  glowColor?: keyof typeof GLOW_COLORS;
  size?: keyof typeof SIZE_CLASSES;
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

export function GlowCard({ children, className = "", glowColor = "blue", size = "md", width, height, customSize = false }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    register(el);
    return () => unregister(el);
  }, []);

  const { base, spread } = GLOW_COLORS[glowColor];

  const style: CSSProperties & Record<string, string | number> = {
    "--base": base,
    "--spread": spread,
    "--radius": "14",
    "--border": "3",
    "--backdrop": "hsl(0 0% 60% / 0.12)",
    "--backup-border": "var(--backdrop)",
    "--size": "200",
    "--outer": "1",
    "--border-size": "calc(var(--border, 2) * 1px)",
    "--spotlight-size": "calc(var(--size, 150) * 1px)",
    "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
    backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
    backgroundColor: "var(--backdrop, transparent)",
    backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
    backgroundPosition: "50% 50%",
    backgroundAttachment: "fixed",
    border: "var(--border-size) solid var(--backup-border)",
    position: "relative",
    touchAction: "pan-y",
  };
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={cardRef}
      data-glow
      style={style}
      className={`${customSize ? "" : SIZE_CLASSES[size]} ${customSize ? "" : "aspect-[3/4]"} relative grid grid-rows-[1fr_auto] gap-4 rounded-2xl p-4 shadow-[0_1rem_2rem_-1rem_black] backdrop-blur-[5px] ${className}`}
    >
      <div ref={innerRef} data-glow />
      {children}
    </div>
  );
}
