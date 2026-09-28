import type { ReactNode } from "react";

/**
 * Sitenin ortak bölüm/sayfa başlığı: noktalı hap rozet (eyebrow) + iri lacivert başlık (+ açıklama).
 * Ana sayfa bölümlerinin ve tüm iç sayfaların (H1) başlıkları bu bileşenle aynı görünür.
 */
type Tone = "light" | "dark";

export function SectionBadge({ children, tone = "light", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  const isDark = tone === "dark";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
        isDark ? "border-white/20 bg-white/10 text-white" : "border-orange-200 bg-orange-50 text-primary"
      } ${className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}

/** Başlık metni sınıfları — ana sayfadaki başlıkla aynı ölçek */
export const SECTION_TITLE_CLASS =
  "font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-balance md:text-4xl lg:text-[2.75rem]";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: Tone;
  /** Sayfa başlığı için "h1" */
  as?: "h1" | "h2";
  className?: string;
  /** Başlık rengini değiştirir (varsayılan: açık zeminde lacivert, koyu zeminde beyaz) */
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  as: Tag = "h2",
  className = "",
  titleClassName,
}: SectionHeadingProps) {
  const isDark = tone === "dark";

  return (
    <div className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      {eyebrow && <SectionBadge tone={tone}>{eyebrow}</SectionBadge>}
      <Tag className={`${eyebrow ? "mt-5" : ""} ${SECTION_TITLE_CLASS} ${titleClassName ?? (isDark ? "text-white" : "text-primary")}`}>{title}</Tag>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed text-pretty md:text-lg ${
            isDark ? "text-neutral-400" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
