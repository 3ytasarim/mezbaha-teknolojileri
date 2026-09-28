import Image from "next/image";
import { SectionHeading } from "@/components/public/section-heading";

const PROCESS_STEPS = [
  "Planlama",
  "Projelendirme",
  "Üretim",
  "Montaj",
  "Devreye Alma",
];

export function TurnkeySolutions() {
  return (
    <section className="bg-surface-dark">
      <div className="mx-auto grid max-w-(--container-wide) grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Anahtar Teslim Çözümler"
            title="Projeden Devreye Almaya Tek Muhatap"
            description="Otomasyon düzeyinde anahtar teslim çözümler sunuyoruz — tesis planlamasından ekipman imalatına, kurulumdan devreye almaya kadar süreci uçtan uca yürütüyoruz."
            tone="dark"
          />
          <ol className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span className="font-heading text-sm font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-neutral-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative min-h-[320px] lg:min-h-0">
          <Image
            src="/images/projects/mezbaha-ekipman-fotografi.jpg"
            alt="Mezbaha sistemleri ekipman kurulum fotoğrafı"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
