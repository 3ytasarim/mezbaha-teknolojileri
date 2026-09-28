import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";

/**
 * 21st.dev "Arrow Fill Button" (hyperiux) — bileşenin herkese açık önizleme paketinden okunup taşındı: sağda yuvarlak ok
 * düğmesi; hover'da yuvarlak, tüm düğmeyi dolduracak şekilde genişler, yazı clip-path ile ters renge döner ve ok soldan
 * kayarak girer. Uyarlamalar: kaynaktaki `vw` tabanlı boyutlar (ekran genişliğiyle orantılı, büyük ekranda devleşiyor) sabit
 * rem boyutlarına çevrildi (3 boyut); renkler site paletine bağlı 3 tona ayrıldı; dokunmatik "basılı" durumu için JS yerine
 * focus-visible kullanıldı; `prefers-reduced-motion` desteği korundu; Next.js Link ve buton desteği eklendi.
 *
 * Hover dolgusu beyaz değil site renkleridir (turuncu düğmede lacivert, lacivert düğmede turuncu).
 * Kullanım: yönlendiren, "git/incele" eylemleri (Ürünü İncele, Tüm yazılar, Yol tarifi…).
 */
type Tone = "accent" | "navy" | "light";
type Size = "sm" | "md" | "lg";

const TONES: Record<Tone, Record<string, string>> = {
  // turuncu zemin; ok yuvarlağı ve hover dolgusu site laciverti (beyaz yazı/ok)
  accent: { "--btn-bg": "#b04a20", "--btn-text": "#ffffff", "--btn-fill-bg": "#23305f", "--btn-fill-text": "#ffffff" },
  // lacivert zemin; laciverte karşı görünür kalsın diye dolgu turuncu
  navy: { "--btn-bg": "#23305f", "--btn-text": "#ffffff", "--btn-fill-bg": "#b04a20", "--btn-fill-text": "#ffffff" },
  // koyu zeminde beyaz düğme; ok yuvarlağı ve hover dolgusu site laciverti
  light: { "--btn-bg": "#ffffff", "--btn-text": "#23305f", "--btn-fill-bg": "#23305f", "--btn-fill-text": "#ffffff" },
};

const SIZES: Record<Size, string> = {
  sm: "h-11 ps-5 text-sm [--icon-circle:2.125rem] [--icon-right:0.3125rem]",
  md: "h-12 ps-6 text-sm [--icon-circle:2.375rem] [--icon-right:0.3125rem]",
  lg: "h-14 ps-8 text-base [--icon-circle:2.75rem] [--icon-right:0.375rem]",
};

type CommonProps = {
  children: string;
  tone?: Tone;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  /** Ekran okuyucuya ek bağlam (ör. hangi ürün): görünmez metin olarak eklenir */
  srHint?: string;
};

type LinkProps = CommonProps & { href: string; external?: boolean };
type ButtonProps = CommonProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const EASE = "duration-[450ms] ease-[cubic-bezier(0.785,0.135,0.15,0.86)] motion-reduce:transition-none";

export function ArrowFillButton(props: LinkProps | ButtonProps) {
  const { children, tone = "accent", size = "md", fullWidth = false, className = "", srHint } = props;

  const classes = [
    "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full border border-(--btn-bg)",
    "bg-(--btn-bg) font-semibold leading-none whitespace-nowrap text-(--btn-text) outline-offset-4",
    "pe-[calc(var(--icon-circle)+var(--icon-right)+1.125rem)]",
    "[--circle-inset-y:calc((100%-var(--icon-circle))/2)]",
    fullWidth ? "w-full" : "w-fit",
    SIZES[size],
    className,
  ].join(" ");

  const style = TONES[tone] as CSSProperties;

  const inner = (
    <>
      <span className="relative z-1 pb-px">{children}</span>
      {srHint && <span className="sr-only"> {srHint}</span>}

      {/* Büyüyen dolgu (yuvarlak → tüm düğme) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute z-2 rounded-full bg-(--btn-fill-bg) inset-[var(--circle-inset-y)_var(--icon-right)_var(--circle-inset-y)_calc(100%-var(--icon-right)-var(--icon-circle))] transition-all ${EASE} group-hover:inset-0 group-focus-visible:inset-0`}
      />
      {/* Aynı yazının ters renkli kopyası: clip-path dolguyla birlikte açılır */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-2 flex items-center ${SIZES[size].split(" ").find((c) => c.startsWith("pl-"))} pe-[calc(var(--icon-circle)+var(--icon-right)+1.125rem)] ${size === "lg" ? "text-base" : "text-sm"} font-semibold text-(--btn-fill-text) [clip-path:inset(var(--circle-inset-y)_var(--icon-right)_var(--circle-inset-y)_calc(100%-var(--icon-right)-var(--icon-circle)))] transition-all ${EASE} group-hover:[clip-path:inset(0_0_0_0)] group-focus-visible:[clip-path:inset(0_0_0_0)]`}
      >
        <span className="relative z-1 pb-px whitespace-nowrap">{children}</span>
      </div>
      {/* Ok yuvarlağı: içerideki iki ok, biri çıkar biri girer */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute end-[var(--icon-right)] top-1/2 z-3 inline-flex h-[var(--icon-circle)] w-[var(--icon-circle)] shrink-0 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-(--btn-fill-bg) text-(--btn-fill-text) transition-colors ${EASE}`}
        style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "radial-gradient(white, black)" }}
      >
        <ArrowRight
          className={`absolute left-1/2 top-1/2 size-[1.1rem] -translate-x-[170%] -translate-y-1/2 scale-0 text-current transition-transform ${EASE} group-hover:-translate-x-1/2 group-hover:scale-100 group-focus-visible:-translate-x-1/2 group-focus-visible:scale-100`}
          strokeWidth={1.8}
        />
        <ArrowRight
          className={`absolute left-1/2 top-1/2 size-[1.1rem] -translate-x-1/2 -translate-y-1/2 text-current transition-transform ${EASE} group-hover:translate-x-[70%] group-hover:scale-0 group-focus-visible:translate-x-[70%] group-focus-visible:scale-0`}
          strokeWidth={1.8}
        />
      </span>
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const external = props.external || /^https?:\/\//.test(props.href);
    return external ? (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes} style={style}>
        {inner}
      </a>
    ) : (
      <Link href={props.href} className={classes} style={style}>
        {inner}
      </Link>
    );
  }

  const { children: _c, tone: _t, size: _s, fullWidth: _f, className: _cn, srHint: _h, ...rest } = props as ButtonProps;
  void _c;
  void _t;
  void _s;
  void _f;
  void _cn;
  void _h;
  return (
    <button type="button" {...rest} className={classes} style={style}>
      {inner}
    </button>
  );
}
