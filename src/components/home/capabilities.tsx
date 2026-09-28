import { Cpu, Factory, Headset, KeyRound, PencilRuler, type LucideIcon } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SectionHeading } from "@/components/public/section-heading";

const ICONS: LucideIcon[] = [PencilRuler, Factory, KeyRound, Cpu, Headset];

/**
 * Ana sayfa — "Yetkinliklerimiz". Düzen: 21st.dev "Feature Section" (ruixen.ui) — solda dikey akan özellik listesi kartı
 * (üst/alt solma), sağda rozet + iri başlık cümlesi + gri açıklama. Kaynaktaki alt etiket butonları konmadı.
 * Liste öğeleri sitenin kendi yetkinlik verisidir (src/content/home.ts); sağdaki metin bu maddelerin özetidir.
 * "Hareketi azalt" tercihinde liste akmaz, kart içinde kaydırılabilir.
 */
function CapabilityRow({ index, items }: { index: number; items: { title: string; description: string }[] }) {
  const capability = items[index];
  const Icon = ICONS[index % ICONS.length];
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
          <span className="font-heading text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{capability.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{capability.description}</p>
        </div>
      </div>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </li>
  );
}

export async function Capabilities() {
  const locale = await getLocale();
  const d = getDictionary(locale).home;
  const items = d.capabilities.items;
  const indexes = items.map((_, index) => index);

  return (
    <section className="relative isolate overflow-hidden border-t border-border bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="intro-blob-b absolute -start-24 top-[18%] h-[440px] w-[440px] rounded-full blob-blue-soft opacity-70" />
        <div className="intro-blob-a absolute -end-20 bottom-[8%] h-[420px] w-[420px] rounded-full blob-orange-soft opacity-90" />
      </div>
      <div className="mx-auto max-w-(--container-wide) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading
          align="center"
          eyebrow={d.capabilities.eyebrow}
          title={d.capabilities.title}
          className="mb-12 lg:mb-16"
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative h-[320px] overflow-hidden rounded-lg border border-border bg-background shadow-xl motion-reduce:overflow-y-auto">
              <div className="marquee-y absolute w-full motion-reduce:static">
                <ul aria-label={d.capabilities.listAria}>
                  {indexes.map((index) => (
                    <CapabilityRow key={index} index={index} items={items} />
                  ))}
                </ul>
                {/* Boşluksuz döngü için özdeş kopya; ekran okuyucudan ve klavyeden gizli */}
                <ul aria-hidden="true" inert className="motion-reduce:hidden">
                  {indexes.map((index) => (
                    <CapabilityRow key={index} index={index} items={items} />
                  ))}
                </ul>
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute start-0 top-0 h-12 w-full bg-gradient-to-b from-background via-background/70 to-transparent" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-12 w-full bg-gradient-to-t from-background via-background/70 to-transparent" />
            </div>
          </div>

          <div className="space-y-6">
            <span className="inline-block rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">{d.capabilities.tag}</span>
            <h3 className="text-lg font-normal leading-relaxed text-foreground lg:text-2xl">
              {d.capabilities.lead}{" "}
              <span className="text-muted-foreground">{d.capabilities.body}</span>
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
