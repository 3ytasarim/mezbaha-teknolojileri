import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SectionBadge, SECTION_TITLE_CLASS } from "@/components/public/section-heading";

/**
 * "Mühendislik Yaklaşımı" — solda eyebrow + iri başlık, sağda 21st.dev "How It Works" (chamaac) bileşeninin düzeni
 * (bileşenin herkese açık önizleme paketinden okunup taşındı): pimli, eğik "not kağıdı" kartlar, zikzak yerleşim, kartları
 * bağlayan akan kesikli çizgi, çizgili defter zemini. Renkler sitenin mavisi ve turuncusu.
 *
 * İÇERİK: eski paragraftaki tek cümlenin adımlara bölünmüş halidir (tasarımda planlanır → kendi imalathanemizde üretilir →
 * sahada devreye alınır); yeni iddia eklenmemiştir. Başlıktaki üç kelime adımlarla aynıdır.
 */
type Step = { title: string; description: string; tone: "accent" | "primary" };

// Ton (renk) sırası sabittir; metinler sözlükten gelir (home.engineering.steps).
const STEP_TONES: Step["tone"][] = ["accent", "primary", "accent"];

const TONES = {
  accent: { panel: "bg-orange-50 border-orange-100", text: "text-accent" },
  primary: { panel: "bg-[#eef1f8] border-[#dbe1f0]", text: "text-primary" },
} as const;

// Masaüstünde zikzak: üst konum / yan / eğim
const POSITIONS = [
  "md:absolute md:start-0 md:top-0 rotate-[5deg]",
  "md:absolute md:end-0 md:top-[270px] -rotate-[5deg]",
  "md:absolute md:start-0 md:top-[540px] rotate-[5deg]",
];

function PinIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
    </svg>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const tone = TONES[step.tone];
  return (
    <li className={`relative w-full transition-transform duration-300 hover:z-30 hover:scale-105 md:w-[280px] ${POSITIONS[index]}`}>
      <div className="rounded-[25px] border border-neutral-100 bg-white p-2 shadow-[0px_10px_20px_0px_#D3D3D3]">
        <PinIcon className={`z-20 mx-auto mb-6 size-8 ${tone.text}`} />
        <div className={`relative flex h-full flex-col overflow-hidden rounded-[15px] border p-[15px] ${tone.panel}`}>
          <span className={`mb-5 font-heading text-4xl font-extrabold ${tone.text}`}>{String(index + 1).padStart(2, "0")}</span>
          <h3 className="mb-[10px] font-heading text-2xl font-semibold leading-none text-neutral-800">{step.title}</h3>
          <p className="text-sm/5 tracking-tight text-neutral-600">{step.description}</p>
        </div>
      </div>
    </li>
  );
}

export async function Engineering() {
  const locale = await getLocale();
  const d = getDictionary(locale).home;
  const steps: Step[] = d.engineering.steps.map((step, i) => ({ ...step, tone: STEP_TONES[i] }));
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="relative mx-auto grid max-w-(--container-wide) items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-8 lg:px-10 lg:py-28">
        <div>
          <SectionBadge>{d.engineering.badge}</SectionBadge>
          <h2 className={`mt-5 ${SECTION_TITLE_CLASS} text-primary lg:text-5xl xl:text-6xl`}>
            {d.engineering.titleLines.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h2>
        </div>

        <div className="relative">
          {/* çizgili defter zemini */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#000_1px,transparent_1px)] [background-size:100%_32px] [mask-image:linear-gradient(to_right,transparent,black_25%,black_75%,transparent)]"
          />
          <div className="relative mx-auto w-full max-w-[620px] md:h-[790px]">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute start-0 top-0 z-0 hidden h-full w-full md:block"
              viewBox="0 0 620 790"
              preserveAspectRatio="none"
            >
              <path
                d="M 290 115 C 345 115, 290 345, 340 345 M 480 490 C 480 590, 390 640, 290 640"
                className="dash-flow stroke-neutral-300"
                strokeWidth="2"
                strokeDasharray="8 6"
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <ol className="relative z-10 flex flex-col space-y-8 md:block md:space-y-0">
              {steps.map((step, index) => (
                <StepCard key={step.title} step={step} index={index} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
