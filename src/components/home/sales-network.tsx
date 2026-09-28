import Image from "next/image";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/dictionaries";
import { WorldMap } from "@/components/ui/world-map";
import { SALES_COUNTRIES } from "@/content/sales-network";
import { SectionHeading } from "@/components/public/section-heading";

/**
 * "Satış Ağımız" — 21st.dev "Map" bileşeni (WorldMap): ortalanmış başlık + açıklama, altında animasyonlu dünya
 * haritası. Merkez: Dilovası / Kocaeli (şirket adresi, site.ts); her yay merkezden bir satış ülkesinin başkentine gider.
 * Altında eski sitenin Satış Ağı sayfasındaki 11 ülke ve bayrakları (gerçek veri).
 */
const flagKey = (flag: string) => flag.split("/").pop()!.replace(/\.\w+$/, "");

export async function SalesNetwork() {
  const locale = await getLocale();
  const d = getDictionary(locale).home;
  const s = d.sales;
  const countryName = (c: (typeof SALES_COUNTRIES)[number]) => s.countries[flagKey(c.flag)] ?? c.name;
  const hub = { lat: 40.7847, lng: 29.5386, label: s.hub };
  const dots = SALES_COUNTRIES.map((country) => ({ start: hub, end: { lat: country.lat, lng: country.lng, label: countryName(country) } }));
  const names = SALES_COUNTRIES.map(countryName).join(", ");

  return (
    <section id="satis-agi" className="relative isolate w-full overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="intro-blob-a absolute -start-24 top-[10%] h-[440px] w-[440px] rounded-full blob-orange-soft opacity-90" />
        <div className="intro-blob-b absolute -end-24 bottom-[6%] h-[480px] w-[480px] rounded-full blob-blue-soft opacity-70" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          align="center"
          eyebrow={s.eyebrow}
          title={s.title}
          description={s.description}
          className="pb-4"
        />

        <WorldMap
          dots={dots}
          lineColor="#b04a20"
          showLabels={false}
          mapSrc="/images/sales-network/world-dots.svg"
          ariaLabel={format(s.mapAria, { hub: s.hub, countries: names })}
        />

        {/* B2B-Voice bayrak şeridi: tek satır, kenarlarda solan maske, soldan girip sağda kaybolur */}
        <div
          role="list"
          aria-label={s.listAria}
          className="mx-auto mt-10 max-w-5xl overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        >
          <div className="marquee-right flex w-max py-1">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-3 pe-3 motion-reduce:[&:nth-child(2)]:hidden" aria-hidden={copy === 1 ? true : undefined}>
                {SALES_COUNTRIES.map((country) => (
                  <div
                    key={country.flag}
                    role={copy === 0 ? "listitem" : undefined}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    <Image src={country.flag} alt="" width={48} height={48} className="size-6 rounded-full object-cover" />
                    {countryName(country)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
