import Image from "next/image";
import Link from "@/components/i18n/link";
import { getLocale } from "@/lib/i18n/server";
import { isPageAvailable } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDisplayBlogPreviews } from "@/lib/content-fallback";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";
import { SectionHeading } from "@/components/public/section-heading";

/**
 * Ana sayfa — blog bölümü. Düzen: 21st.dev "Blog Section" (tommyjepsen) — solda iri sıkı başlık,
 * sağda koyu "tüm yazılar" butonu, altında görselli 4 kart (görsel + başlık + gri özet). Kaynak kod anahtar
 * gerektirdiği için önizleme görselinden yeniden kuruldu. İçerik sitenin kendi blog yazılarıdır.
 */
export async function KnowledgeCenter() {
  const locale = await getLocale();
  if (!isPageAvailable(locale, "/blog")) return null;
  const d = getDictionary(locale).home;
  const posts = await getDisplayBlogPreviews(locale);

  return (
    <section
      id="blog"
      className="border-t border-border bg-background"
    >
      <div className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow={d.knowledge.eyebrow} title={d.knowledge.title} />
          <ArrowFillButton href="/blog" tone="navy" size="lg">
            {d.knowledge.all}
          </ArrowFillButton>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:mt-14 lg:gap-6 lg:grid-cols-4">
          {posts.map((post) => (
            <Link key={post.href} href={post.href} className="group flex flex-col">
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <h3 className="mt-6 text-xl font-normal leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              {post.excerpt ? (
                <p className="mt-3 line-clamp-3 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
