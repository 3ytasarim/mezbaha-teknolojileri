import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getContactSettings } from "@/lib/site-settings";
import { Button3D } from "@/components/ui/button-3d";

export async function FinalCta() {
  const contact = await getContactSettings();
  const locale = await getLocale();
  const d = getDictionary(locale).home;


  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#9a3f19] via-accent to-[#c85a2a]">
      <div aria-hidden="true" className="pointer-events-none absolute -end-24 -top-24 -z-10 size-96 rounded-full blob-white opacity-20" />
      <div className="mx-auto max-w-(--container-wide) px-4 py-20 text-center sm:px-6 lg:px-10 lg:py-28">
        <h2 className="mx-auto max-w-2xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-balance text-primary-foreground sm:text-4xl lg:text-5xl">
          {d.cta.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/90">
          {d.cta.body}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button3D href="/teklif-al" tone="navy" size="lg">
            {d.cta.quote}
          </Button3D>
          <Button3D href={`tel:${contact.phones[0].value.replace(/\s/g, "")}`} tone="light" size="lg">
            {d.cta.contact}
          </Button3D>
        </div>
      </div>
    </section>
  );
}
