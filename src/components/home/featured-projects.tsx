import Image from "next/image";
import Link from "@/components/i18n/link";
import { SectionHeading } from "@/components/public/section-heading";
import { getDisplayFeaturedProjects } from "@/lib/content-fallback";

export async function FeaturedProjects() {
  const projects = await getDisplayFeaturedProjects();

  return (
    <section id="projeler" className="border-t border-border bg-background">
      <div className="mx-auto max-w-(--container-wide) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading
          eyebrow="Öne Çıkan Projeler"
          title="Farklı Kapasitelerde Tamamlanan Tesisler"
        />

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto">
            <Image
              src="/images/projects/mezbaha-proje-ornegi.jpg"
              alt="Tamamlanmış mezbaha projesi örneği"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />
            <p className="absolute bottom-4 start-4 text-xs font-medium text-white/80">
              Proje galerisinden
            </p>
          </div>

          <div className="flex flex-col">
            <ul className="flex flex-1 flex-col divide-y divide-border border-y border-border">
              {projects.map((project) => (
                <li key={`${project.country}-${project.city}`} className="flex items-center justify-between gap-4 py-5">
                  <div>
                    <p className="font-heading text-lg font-bold tracking-tight text-foreground">
                      {project.country} — {project.city}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{project.type}</p>
                  </div>
                  <p className="shrink-0 text-end text-sm font-medium text-foreground">
                    {project.capacity}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src="/images/projects/kucuk-olcekli-mezbaha-projesi.jpg"
                  alt="Küçük ölçekli mezbaha projesi — yaklaşık 30 büyükbaş ve 50 koyun kapasiteli tesis"
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src="/images/projects/mezbaha-proje-3d-tasarim.jpg"
                  alt="Mezbaha sistemleri 3D proje tasarım görseli"
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              </div>
            </div>

            <Link
              href="/projeler"
              className="mt-6 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Tüm Projeleri Görüntüle →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
