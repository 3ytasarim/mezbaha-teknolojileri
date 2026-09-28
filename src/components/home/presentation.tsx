import { getLocale } from "@/lib/i18n/server";
import { isPageAvailable } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import presentation from "@/content/legacy/presentation.json";
import { PresentationSlider } from "./presentation-slider";
import { SectionHeading } from "@/components/public/section-heading";

/**
 * Ana sayfa — eski sitenin "PRESENTATİON" bölümü (referans projeler). Proje verisi ve görselleri eski sitenin gerçek
 * içeriğidir (prisma/migration/acquire-presentation.ts; kaynak: docs/presentation-provenance.json).
 * Düzen: B2B-Voice "Industries" bölümü (rozet + büyük başlık + alt metin, altında tam genişlik carousel).
 * Arka plan: sitenin genel krem zemini (bg-background).
 * Başlık ve alt metin sitenin kendi /projeler sayfasındaki ifadelerdir.
 */
export async function Presentation() {
  const locale = await getLocale();
  if (!isPageAvailable(locale, "/projeler")) return null;
  const d = getDictionary(locale).home;
  return (
    <section id="presentation" className="overflow-hidden bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          className="mb-10 md:mb-14"
          eyebrow={d.presentation.eyebrow}
          title={d.presentation.title}
          description={d.presentation.description}
        />
      </div>

      <PresentationSlider items={presentation.items} label={d.presentation.aria} />
    </section>
  );
}
