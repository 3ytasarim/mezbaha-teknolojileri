"use client";

import Link from "@/components/i18n/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * 21st.dev "Button" (avanishverma4) — 3B "basılabilir" düğme: alt kenarda kalın koyu şerit (border-b-4 + 0 6px 0 gölge),
 * hover'da hafif büyür ve yükselir, basınca 4px aşağı çöker (spring animasyonu). Bileşenin herkese açık önizleme
 * paketinden okunup taşındı. Uyarlamalar: mavi/gri/yeşil/kırmızı/sarı varyantları yerine site paleti (turuncu, lacivert,
 * beyaz, yeşil-WhatsApp), `href` desteği (Next.js Link), tam genişlik, `prefers-reduced-motion` desteği, form gönder tipi.
 *
 * Kullanım: dönüşüm eylemleri (teklif iste/gönder, form gönderimi).
 */
type Tone = "accent" | "navy" | "light";
type Size = "sm" | "md" | "lg";

const TONES: Record<Tone, { cls: string; edge: string }> = {
  accent: { cls: "bg-accent text-white border-[#7a3210] hover:bg-accent-hover focus-visible:ring-orange-300", edge: "#7a3210" },
  navy: { cls: "bg-primary text-white border-[#131b3d] hover:bg-[#2b3a70] focus-visible:ring-blue-300", edge: "#131b3d" },
  light: { cls: "bg-white text-primary border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300", edge: "#cbd5e1" },
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

type CommonProps = { children: ReactNode; tone?: Tone; size?: Size; fullWidth?: boolean; className?: string };
type LinkProps = CommonProps & { href: string; external?: boolean; type?: never; disabled?: never; onClick?: never };
type ButtonProps = CommonProps & { href?: undefined; external?: never; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void };

const MotionLink = motion.create(Link);

export function Button3D(props: LinkProps | ButtonProps) {
  const { children, tone = "accent", size = "md", fullWidth = false, className = "" } = props;
  const reduced = useReducedMotion();
  const { cls, edge } = TONES[tone];
  const disabled = "disabled" in props && props.disabled;

  const classes = `inline-flex select-none items-center justify-center gap-2 rounded-lg border-b-4 font-bold outline-none transition-colors focus-visible:ring-4 ${cls} ${SIZES[size]} ${
    fullWidth ? "w-full" : ""
  } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`;

  const rest = `0 6px 0 0 ${edge}`;
  const motionProps = reduced
    ? { style: { boxShadow: rest } }
    : {
        initial: { boxShadow: rest, y: 0 },
        animate: { boxShadow: rest, y: 0 },
        whileHover: disabled ? undefined : { scale: 1.02, boxShadow: `0 8px 0 0 ${edge}`, transition: { duration: 0.1 } },
        whileTap: disabled ? undefined : { scale: 0.98, y: 4, boxShadow: `0 2px 0 0 ${edge}`, transition: { duration: 0.1 } },
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      };

  if ("href" in props && props.href !== undefined) {
    const external = props.external || /^https?:\/\//.test(props.href);
    return external ? (
      <motion.a href={props.href} target="_blank" rel="noopener noreferrer" className={classes} {...motionProps}>
        {children}
      </motion.a>
    ) : (
      <MotionLink href={props.href} className={classes} {...motionProps}>
        {children}
      </MotionLink>
    );
  }

  const b = props as ButtonProps;
  return (
    <motion.button type={b.type ?? "button"} disabled={b.disabled} onClick={b.onClick} className={classes} {...motionProps}>
      {children}
    </motion.button>
  );
}
