import { getLocale } from "@/lib/i18n/server";
import homeSeo from "@/content/legacy/home-seo.json";
import { SectionBadge } from "@/components/public/section-heading";

/**
 * Ana sayfa alt metni (Satış Ağı haritasının altı): eski sitenin ana sayfasındaki uzun tanıtım/SEO metni, dil başına kendi
 * dilinde (src/content/legacy/home-seo.json — kaynak: eski sitenin TR/EN/RU ana sayfası). Metin başlıklarından bölünür:
 * giriş paragrafı üstte ortalı, her başlık tek tek tam genişlikte bir satır (başlık+numara ↔ metin, satır satır sağlı-sollu dönüşümlü), sonuncusu tam genişlikte vurgulu bant.
 * Metni olmayan dillerde bölüm gösterilmez.
 */
type Block = { title: string; html: string };

function split(html: string): { intro: string; blocks: Block[] } {
  const parts = html.split(/(?=<h[23]>)/);
  const intro = parts[0].startsWith("<h") ? "" : parts.shift() ?? "";
  const blocks = parts.map((p) => {
    const m = p.match(/^<h[23]>([\s\S]*?)<\/h[23]>\s*([\s\S]*)$/);
    return { title: (m?.[1] ?? "").replace(/<[^>]+>/g, "").trim(), html: (m?.[2] ?? p).trim() };
  });
  return { intro: intro.trim(), blocks };
}

const BADGE: Record<string, string> = {
  tr: "Mezbaha Sistemleri",
  en: "Slaughterhouse Systems",
  ru: "Системы для скотобоен",
  de: "Schlachthofsysteme",
  fr: "Systèmes d'abattoir",
  ar: "أنظمة المسالخ",
};

const BODY =
  "space-y-4 text-[15px] leading-relaxed [&_strong]:font-semibold [&_a]:underline [&_ul]:list-disc [&_ul]:ps-5 [&_li]:mt-1";

export async function HomeSeoText() {
  const locale = await getLocale();
  const html = (homeSeo.locales as Record<string, string>)[locale];
  if (!html) return null;
  const { intro, blocks } = split(html);
  if (blocks.length === 0) return null;
  const last = blocks[blocks.length - 1];
  const cards = blocks.slice(0, -1);

  return (
    <section className="relative isolate overflow-hidden border-t border-border bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="intro-blob-b blob-blue absolute -start-24 top-[8%] h-[460px] w-[460px] rounded-full opacity-50" />
        <div className="intro-blob-a blob-orange absolute -end-24 bottom-[10%] h-[460px] w-[460px] rounded-full opacity-50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {intro && (
          <div className="mx-auto max-w-4xl text-center">
            <SectionBadge>{BADGE[locale] ?? BADGE.en}</SectionBadge>
            <div
              className={`mt-6 text-base text-muted-foreground md:text-lg [&_p+p]:mt-4 [&_strong]:font-semibold [&_strong]:text-foreground`}
              dangerouslySetInnerHTML={{ __html: intro }}
            />
          </div>
        )}

        <div className="mt-14 space-y-6 lg:space-y-8">
          {cards.map((b, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={b.title}
                className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                  <div
                    className={`relative flex flex-col justify-center gap-4 p-7 sm:p-10 lg:p-12 ${flip ? "lg:order-2" : ""} ${i % 2 === 0 ? "bg-orange-50/70" : "bg-blue-50/70"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none select-none font-heading text-7xl font-black leading-none lg:text-8xl ${i % 2 === 0 ? "text-orange-200" : "text-blue-200"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={`h-1 w-12 rounded-full ${i % 2 === 0 ? "bg-accent" : "bg-primary"}`} />
                    <h3 className="font-heading text-xl font-extrabold leading-snug tracking-tight text-primary md:text-2xl">{b.title}</h3>
                  </div>
                  <div className={`p-7 text-muted-foreground sm:p-10 lg:p-12 ${BODY}`} dangerouslySetInnerHTML={{ __html: b.html }} />
                </div>
              </article>
            );
          })}

          <article className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#16204a] via-primary to-[#2f3f7d] p-8 text-white shadow-lg sm:p-12">
            <div aria-hidden="true" className="blob-accent pointer-events-none absolute -bottom-24 -end-16 -z-10 size-96 rounded-full opacity-60" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
              <h3 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl">{last.title}</h3>
              <div className={`text-white/85 [&_strong]:text-white ${BODY}`} dangerouslySetInnerHTML={{ __html: last.html }} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
