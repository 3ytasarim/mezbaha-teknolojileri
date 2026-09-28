import { organizationJsonLd, websiteJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getContactSettings } from "@/lib/site-settings";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { SOCIAL } from "@/content/site";
import "../header-hero.css";
import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const contact = await getContactSettings();
  const locale = await getLocale();
  const logoMeta = await getLocalImageMeta("/icon.png");

  return (
    <LocaleProvider locale={locale} dict={getDictionary(locale)}>
      <script
        {...jsonLdScriptProps(
          organizationJsonLd({
            ...(logoMeta ? { logo: { url: "/icon.png", width: logoMeta.width, height: logoMeta.height } } : {}),
            contactPhone: contact.phones[0].value,
            contactEmail: contact.emails[0].value,
            address: {
              streetAddress: contact.address.line1,
              addressLocality: contact.address.locality,
              addressCountry: contact.address.country,
            },
            // Gerçek, footer'da render edilen sosyal medya hesapları (src/content/site.ts) — uydurma URL yok.
            sameAs: SOCIAL.map((s) => s.href),
          })
        )}
      />
      <script {...jsonLdScriptProps(websiteJsonLd(locale))} />

      <Header />
      <div className="relative flex-1">
        {children}
        {/* Tüm sayfalarda (alt bilgi hariç) yavaşça süzülen renk lekeleri; tıklamayı engellemez, hareket azaltmada durur. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <div className="intro-blob-a absolute -start-40 top-[6%] h-[520px] w-[520px] rounded-full blob-orange opacity-40" />
          <div className="intro-blob-b absolute -end-40 top-[24%] h-[560px] w-[560px] rounded-full blob-blue opacity-40" />
          <div className="intro-blob-b absolute -start-40 top-[48%] h-[520px] w-[520px] rounded-full blob-blue opacity-40" />
          <div className="intro-blob-a absolute -end-40 top-[70%] h-[560px] w-[560px] rounded-full blob-orange opacity-40" />
          <div className="intro-blob-b absolute -start-40 bottom-[2%] h-[480px] w-[480px] rounded-full blob-orange opacity-40" />
        </div>
      </div>
      <Footer />
    </LocaleProvider>
  );
}
