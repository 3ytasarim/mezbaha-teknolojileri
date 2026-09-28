import { SectionHeading } from "@/components/public/section-heading";
import { getDisplayCapacityPackages } from "@/lib/content-fallback";

function slug(code: string) {
  return code.toLowerCase().replace(/\s+/g, "-");
}

export async function CapacitySolutions() {
  const packages = await getDisplayCapacityPackages();

  const visibilityRules = packages.map(
    (pkg) =>
      `.capacity-selector:has(#cap-${slug(pkg.code)}:checked) .panel-${slug(pkg.code)} { display: grid; }`
  ).join("\n");

  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-(--container-wide) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <SectionHeading
          eyebrow="Kapasiteye Göre Çözümler"
          title="Tesis Büyüklüğünüze Uygun Sistem Paketi"
          description="Kesimhane kapasitenize göre planlanan tesis paketlerinden birini seçerek alan ve kapasite bilgisini görüntüleyin."
        />

        <div className="capacity-selector relative mt-10">
          <style dangerouslySetInnerHTML={{ __html: visibilityRules }} />

          <div role="radiogroup" aria-label="Kapasite paketi seçimi" className="flex flex-wrap gap-2">
            {packages.map((pkg, index) => (
              <div key={pkg.code}>
                <input
                  type="radio"
                  name="capacity"
                  id={`cap-${slug(pkg.code)}`}
                  className="peer sr-only"
                  defaultChecked={index === 0}
                />
                <label
                  htmlFor={`cap-${slug(pkg.code)}`}
                  className="inline-flex h-11 cursor-pointer items-center rounded-sm border border-border bg-surface px-4 font-heading text-sm font-bold tracking-tight text-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"
                >
                  {pkg.code}
                </label>
              </div>
            ))}
          </div>

          <div className="panels mt-8 border border-border bg-surface p-6 lg:p-10">
            {packages.map((pkg, index) => (
              <div
                key={pkg.code}
                className={`panel-${slug(pkg.code)} grid-cols-1 gap-6 sm:grid-cols-3 ${
                  index === 0 ? "grid" : "hidden"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Paket
                  </p>
                  <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-foreground">
                    {pkg.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Alan
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{pkg.area}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kapasite
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{pkg.capacity}</p>
                </div>
                <p className="sm:col-span-3 text-sm leading-relaxed text-muted-foreground">
                  {pkg.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
