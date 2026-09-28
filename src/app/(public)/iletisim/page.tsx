import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { format } from "@/lib/i18n/dictionaries";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getContactSettings, whatsappOf } from "@/lib/site-settings";
import { ProductsHero } from "@/components/public/products-hero";
import { SectionHeading } from "@/components/public/section-heading";
import { ContactForm } from "@/components/public/contact-form";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({ title: d.contact.metaTitle, description: d.contact.metaDescription, path: "/iletisim", locale });
}

/**
 * İletişim — bölünmüş kart: solda koyu mavi bilgi paneli (adres, telefonlar, e-postalar, WhatsApp), sağda form.
 * Altta Google Haritalar gömmesi (Mezbaha Teknolojileri yer işareti; varsayılandan 2 kademe uzak) ve üstünde animasyonlu
 * konum etiketi + zıplayan kırmızı pin. Tüm bilgiler site.ts iletişim verisindendir.
 */
// Kullanıcının verdiği gömme adresi; 1d (görüş mesafesi) 3016.67 → 12066.68: iki yakınlaştırma kademesi uzak.
const MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12066.68!2d29.563097376524023!3d40.879083827369335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cad87b6061550b%3A0x816ffe71bf854e7d!2sMezbaha%20Teknolojileri!5e0!3m2!1str!2str!4v1790337509492!5m2!1str!2str";

const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

function InfoRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-inset ring-white/15">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{title}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const { locale, d } = await getI18n();
  const c = d.contact;
  const label = (l: string) => (locale === "tr" ? l : (c.labels[l] ?? l));
  const CONTACT = await getContactSettings();
  const WHATSAPP_DIGITS = whatsappOf(CONTACT).digits;
  const ADDRESS_TEXT = `${CONTACT.address.line1}, ${CONTACT.address.line2}`;
  const MAP_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS_TEXT)}`;

  return (
    <main>
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: c.metaTitle, path: localizePath(locale, "/iletisim") },
          ])
        )}
      />

      <ProductsHero
        eyebrow={c.metaTitle}
        crumbs={[{ label: d.common.home, href: "/" }, { label: c.metaTitle }]}
        title={c.heroTitle}
        description={c.heroDescription}
        chips={[]}
      />

      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow={c.infoEyebrow}
            title={c.infoTitle}
            className="mb-12"
          />

          <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-24px_rgba(35,48,95,0.4)] lg:grid-cols-5">
            {/* Sol: koyu bilgi paneli */}
            <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#16204a] via-primary to-[#2f3f7d] p-7 text-white sm:p-10 lg:col-span-2">
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -end-24 -z-10 size-72 rounded-full bg-accent/30 blur-[90px]" />
              <div aria-hidden="true" className="pointer-events-none absolute -start-16 -top-16 -z-10 size-56 rounded-full border border-white/10" />
              <div aria-hidden="true" className="pointer-events-none absolute -start-8 -top-8 -z-10 size-40 rounded-full border border-white/10" />

              <h2 className="font-heading text-2xl font-bold tracking-tight">{c.directTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {c.directText}
              </p>

              <div className="mt-9 flex flex-col gap-8">
                <InfoRow icon={<MapPin className="size-[18px]" aria-hidden="true" />} title={c.address}>
                  <a href={MAP_DIRECTIONS} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-2 text-[15px] leading-relaxed text-white hover:text-orange-200">
                    <address className="not-italic">
                      {CONTACT.address.line1}
                      <br />
                      {CONTACT.address.line2}
                    </address>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-white/50 transition group-hover:text-orange-200 rtl:-scale-x-100" aria-hidden="true" />
                    <span className="sr-only">{c.directionsSr} {d.common.opensInNewTab}</span>
                  </a>
                </InfoRow>

                <InfoRow icon={<Phone className="size-[18px]" aria-hidden="true" />} title={c.phone}>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-4">
                    {CONTACT.phones.map((phone) => (
                      <li key={phone.value}>
                        <span className="block text-xs text-white/60">{label(phone.label)}</span>
                        <a href={`tel:${phone.value.replace(/\s/g, "")}`} className="inline-block whitespace-nowrap py-1 text-[15px] font-semibold text-white hover:text-orange-200">
                          {phone.value}
                        </a>
                      </li>
                    ))}
                  </ul>
                </InfoRow>

                <InfoRow icon={<Mail className="size-[18px]" aria-hidden="true" />} title={c.email}>
                  <ul className="flex flex-col gap-4">
                    {CONTACT.emails.map((email) => (
                      <li key={email.value}>
                        <span className="block text-xs text-white/60">{label(email.label)}</span>
                        <a href={`mailto:${email.value}`} className="text-[15px] font-semibold text-white [overflow-wrap:anywhere] hover:text-orange-200">
                          {email.value}
                        </a>
                      </li>
                    ))}
                  </ul>
                </InfoRow>
              </div>

              {WHATSAPP_DIGITS && (
                <a
                  href={`https://wa.me/${WHATSAPP_DIGITS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e7f3a] px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(14,127,58,0.4)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0b6a30]"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
                    <path d={WA_PATH} />
                  </svg>
                  {c.whatsappWrite}
                  <span className="sr-only"> {d.common.opensInNewTab}</span>
                </a>
              )}
            </div>

            {/* Sağ: form */}
            <div className="lg:col-span-3">
              <ContactForm bare />
            </div>
          </div>
        </div>
      </section>

      {/* Harita */}
      <section aria-labelledby="harita-baslik" className="bg-background pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow={c.mapEyebrow} title={c.mapTitle} />
            <ArrowFillButton href={MAP_DIRECTIONS} external tone="navy" srHint={c.directionsHint}>
              {c.directions}
            </ArrowFillButton>
          </div>
          <h2 id="harita-baslik" className="sr-only">
            {c.mapHeading}
          </h2>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_30px_80px_-24px_rgba(35,48,95,0.4)]">
            <iframe
              title={format(c.mapTitleAttr, { address: ADDRESS_TEXT })}
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="block h-[380px] w-full border-0 sm:h-[460px] lg:h-[540px]"
            />

            {/* Animasyonlu konum: yer işaretinin (harita merkezi) üstüne binen zıplayan pin + üstünde süzülen etiket */}
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-10">
              {/* Google'ın kırmızı yer işaretiyle aynı boyutta/renkte pin; onun üstüne biner ve zıplar (iframe içindeki asıl işaret hareket ettirilemez) */}
              <div className="absolute start-0 top-0 -translate-x-1/2 -translate-y-full">
                <span className="map-pin-shadow absolute bottom-0 left-1/2 h-1.5 w-5 -translate-x-1/2 translate-y-1/2 rounded-full bg-black/35 blur-[2px]" />
                <svg viewBox="0 0 27 43" className="map-pin-hop relative block h-[52px] w-[32px] drop-shadow-md">
                  <path
                    d="M13.5 0C6.04 0 0 6.04 0 13.5 0 23.6 13.5 43 13.5 43S27 23.6 27 13.5C27 6.04 20.96 0 13.5 0Z"
                    fill="#EA4335"
                    stroke="#B31412"
                    strokeWidth="0.6"
                  />
                  <circle cx="13.5" cy="13.5" r="5.2" fill="#7A1A12" />
                </svg>
              </div>
              <div className="absolute start-0 top-0 -translate-x-1/2 -translate-y-[calc(100%+70px)]">
                <div className="float-y flex items-center gap-3 rounded-2xl bg-white py-2.5 ps-2.5 pe-4 shadow-[0_14px_36px_rgba(35,48,95,0.35)] ring-1 ring-black/5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50">
                    <Image src="/images/about/mezbaha-favicon.png" alt="" width={40} height={40} className="size-7" />
                  </span>
                  <span className="whitespace-nowrap">
                    <span className="block text-sm font-bold leading-tight text-primary">{d.common.siteName}</span>
                    <span className="block text-xs leading-tight text-muted-foreground">Dilovası / Kocaeli</span>
                  </span>
                </div>
                <span className="mx-auto -mt-1.5 block size-3 rotate-45 bg-white shadow-[3px_3px_6px_rgba(35,48,95,0.15)]" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{ADDRESS_TEXT}</p>
        </div>
      </section>
    </main>
  );
}
