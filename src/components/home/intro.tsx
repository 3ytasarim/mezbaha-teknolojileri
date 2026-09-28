import { ArrowFillButton } from "@/components/ui/arrow-fill-button";
import { getLocale } from "@/lib/i18n/server";
import { isPageAvailable } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { IntroOrbit } from "./intro-orbit";
import { SectionBadge, SECTION_TITLE_CLASS } from "@/components/public/section-heading";

/**
 * "Kurumsal" bölümü — meridius.ch'deki halka düzenine uyarlandı: solda rozet + iri başlık + paragraf, sağda ortada marka
 * simgesi ve çevresinde 6 başlıklı nokta. İçerik eski sitenin "Kurumsal" sayfasındaki gerçek cümlelerdir (sözlük: home.intro).
 */
export async function Intro({ showCta = true }: { showCta?: boolean }) {
  const locale = await getLocale();
  const d = getDictionary(locale).home;
  return (
    <section className="relative isolate overflow-x-clip bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="intro-blob-a absolute -top-24 start-[8%] h-[420px] w-[420px] rounded-full blob-orange opacity-70" />
        <div className="intro-blob-b absolute -bottom-32 end-[6%] h-[520px] w-[520px] rounded-full blob-blue opacity-70" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div>
            <SectionBadge>{d.intro.badge}</SectionBadge>
            <h2 className={`mt-5 ${SECTION_TITLE_CLASS} text-primary`}>
              {d.intro.title}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{d.intro.about}</p>
            {showCta && isPageAvailable(locale, "/hakkimizda") && (
              <div className="mt-8">
                <ArrowFillButton href="/hakkimizda" size="lg">
                  {d.intro.more}
                </ArrowFillButton>
              </div>
            )}
          </div>

          <IntroOrbit items={d.intro.orbit} />
        </div>
      </div>
    </section>
  );
}
