import { SectionHeading } from "@/components/public/section-heading";
import { getDisplayGlobalProjects } from "@/lib/content-fallback";

export async function GlobalProjects() {
  const projects = await getDisplayGlobalProjects();
  const countryCount = new Set(projects.map((project) => project.country)).size;

  return (
    <section className="bg-surface-dark">
      <div className="mx-auto max-w-(--container-wide) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Uluslararası Sahalar"
              title={`${countryCount} Ülkede Saha Deneyimi`}
              description="Aşağıdaki referans listesi, tamamlanan projelerin ülke, tesis tipi ve kapasite bilgilerini içerir."
              tone="dark"
            />
          </div>

          <ul className="grid grid-cols-1 gap-x-8 gap-y-0 border-t border-white/10 sm:grid-cols-2">
            {projects.map((project) => (
              <li
                key={`${project.country}-${project.city}`}
                className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4"
              >
                <div>
                  <p className="font-heading text-base font-bold tracking-tight text-white">
                    {project.country}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {project.city} — {project.type}
                  </p>
                </div>
                <p className="shrink-0 text-end text-xs text-neutral-400">
                  {project.capacity}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
