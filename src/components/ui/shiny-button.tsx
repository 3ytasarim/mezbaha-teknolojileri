import Link from "@/components/i18n/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * 21st.dev "Shiny Button" (hyperiux) — bileşenin herkese açık önizleme paketinden okunup taşındı: kenarlıkta dönen konik
 * gradyan ışık, hover'da parlayan kenar + nefes alan iç ışık + noktalı doku + dönen parıltı. Uyarlamalar: kaynaktaki
 * bileşen içi <style> ve useId yerine tek bir global stil (header-hero.css `.shiny-btn`), renkler CSS değişkenleriyle (site
 * laciverti/turuncusu); `prefers-reduced-motion` desteği aynen korundu; bağlantı (href) ve gönder (submit) desteği eklendi.
 *
 * Kullanım: dönüşüm odaklı ana eylemler (Teklif iste/gönder, form gönderimi). `tone="navy"` açık zeminde, `tone="dark"` koyu zeminde.
 */
type Tone = "navy" | "dark";

const TONES: Record<Tone, Record<string, string>> = {
  navy: { "--shiny-fill": "#23305f", "--shiny-inset": "#1a2450", "--shiny-accent": "#e0642c", "--shiny-accent-soft": "#ffa06b" },
  dark: { "--shiny-fill": "#141c40", "--shiny-inset": "#0f1633", "--shiny-accent": "#ff6a2b", "--shiny-accent-soft": "#ffb083" },
};

type CommonProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  fullWidth?: boolean;
};

type LinkProps = CommonProps & { href: string; external?: boolean };
type ButtonProps = CommonProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function ShinyButton(props: LinkProps | ButtonProps) {
  const { children, tone = "navy", className = "", fullWidth = false } = props;
  const classes = `shiny-btn ${fullWidth ? "w-full" : ""} ${className}`;
  const style = TONES[tone] as React.CSSProperties;

  if ("href" in props && props.href !== undefined) {
    const external = props.external || /^https?:\/\//.test(props.href);
    return external ? (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className={classes} style={style}>
        <span>{children}</span>
      </a>
    ) : (
      <Link href={props.href} className={classes} style={style}>
        <span>{children}</span>
      </Link>
    );
  }

  const { children: _c, tone: _t, className: _cn, fullWidth: _f, ...rest } = props as ButtonProps;
  void _c;
  void _t;
  void _cn;
  void _f;
  return (
    <button type="button" {...rest} className={classes} style={style}>
      <span>{children}</span>
    </button>
  );
}
