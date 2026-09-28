import Image from "next/image";
import Link from "@/components/i18n/link";
import { getLocale } from "@/lib/i18n/server";
import { LOCALE_META } from "@/lib/i18n/config";

/** Blog kartı (blog listesi, etiket sayfası, "Son Gönderiler"): kapak, kategori, başlık, özet, tarih. */
export async function BlogCard({
  slug,
  title,
  excerpt,
  image,
  imageAlt,
  category,
  publishedAt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  as: Heading = "h2",
}: {
  slug: string;
  title: string;
  excerpt?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  category?: string;
  publishedAt?: Date | null;
  sizes?: string;
  as?: "h2" | "h3";
}) {
  const locale = await getLocale();
  return (
    <Link href={`/blog/${slug}`} className="group flex flex-col">
      {image && (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="mt-5 flex flex-1 flex-col">
        {category && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{category}</p>}
        <Heading className="mt-1.5 font-heading text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {title}
        </Heading>
        {excerpt && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>}
        {publishedAt && (
          <time dateTime={publishedAt.toISOString()} className="mt-3 text-xs text-muted-foreground">
            {publishedAt.toLocaleDateString(LOCALE_META[locale].intl, { year: "numeric", month: "long", day: "numeric" })}
          </time>
        )}
      </div>
    </Link>
  );
}
