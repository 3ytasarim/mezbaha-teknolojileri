import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";

/**
 * 21st.dev "Project Card" (ravikatiyar162) — kaynak, bileşenin herkese açık önizleme paketinden okunup taşındı:
 * hover'da yukarı kalkma + gölge, hover'da görsel yakınlaşma, başlık hover rengi, içerik alanı ve
 * ok animasyonlu "devamı" bağlantısı.
 *
 * Uyarlamalar (davranış aynı):
 *  - shadcn CSS değişkenleri yerine sitenin tokenları: bg-card → beyaz, text-card-foreground → foreground.
 *  - `description` ReactNode olabilir (birden çok satır için); görsel oranı `imageClassName` ile değiştirilebilir
 *    (varsayılan asıl bileşendeki `aspect-video`).
 *  - Bağlantı varsayılan olarak asıl bileşendeki gibi yeni sekmede açılır (`external`); site içi bağlantılar için
 *    `external={false}` verilir ve Next.js `Link` kullanılır.
 *  - Asıl bileşendeki boş `stopPropagation` işleyicisi kaldırıldı (kart üzerinde tıklama işleyicisi yok).
 */
type ProjectCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  imgSrc: string;
  title: string;
  description: ReactNode;
  link: string;
  linkText?: string;
  external?: boolean;
  imageClassName?: string;
  imgAlt?: string;
};

export const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    { className = "", imgSrc, title, description, link, linkText = "View Project", external = true, imageClassName = "aspect-video", imgAlt, ...props },
    ref
  ) => {
    const linkClass =
      "group/button mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition-all duration-300 hover:underline";
    const arrow = <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-1 rtl:-scale-x-100" aria-hidden="true" />;

    return (
      <div
        ref={ref}
        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-sm transition-all duration-500 ease-in-out hover:-translate-y-2 hover:shadow-xl ${className}`}
        {...props}
      >
        <div className={`${imageClassName} overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={imgAlt ?? title}
            className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
            loading="lazy"
          />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-xl font-semibold transition-colors duration-300 group-hover:text-primary">{title}</h3>
          <p className="mt-3 flex-1 text-muted-foreground">{description}</p>
          {external ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {linkText}
              {arrow}
              <span className="sr-only"> (yeni sekmede açılır) — {title}</span>
            </a>
          ) : (
            <Link href={link} className={linkClass}>
              {linkText}
              {arrow}
              <span className="sr-only"> — {title}</span>
            </Link>
          )}
        </div>
      </div>
    );
  }
);
ProjectCard.displayName = "ProjectCard";
