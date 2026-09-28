import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";
import { ENABLED_LOCALES, LOCALE_META, isPageAvailable } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * llms.txt: yapay zekâ asistanları için site özeti. Etkin her dil için (varsayılan dil dahil) o dilin adresleri ve
 * kendi dilinde başlıkları yazılır. Yeni dil ENABLED_LOCALES'e eklenince otomatik görünür.
 */
const SECTIONS: { path: string; key: "/urunler" | "/projeler" | "/blog" | "/kataloglar" | "/videolar" | "/hizmetler" | "/hakkimizda" | "/iletisim" }[] = [
  { path: "/urunler", key: "/urunler" },
  { path: "/projeler", key: "/projeler" },
  { path: "/blog", key: "/blog" },
  { path: "/kataloglar", key: "/kataloglar" },
  { path: "/videolar", key: "/videolar" },
  { path: "/hizmetler", key: "/hizmetler" },
  { path: "/hakkimizda", key: "/hakkimizda" },
  { path: "/iletisim", key: "/iletisim" },
];

export function GET() {
  const siteUrl = getSiteUrl();

  const block = (locale: (typeof ENABLED_LOCALES)[number]) => {
    const d = getDictionary(locale);
    const home = localizePath(locale, "/");
    const lines = SECTIONS.filter((s) => isPageAvailable(locale, s.path)).map((s) => `- ${d.nav[s.key]}: ${siteUrl}${localizePath(locale, s.path)}`);
    return [
      `## ${LOCALE_META[locale].nativeName} (${locale})`,
      `> ${d.footer.positioning}.`,
      `- ${d.common.home}: ${siteUrl}${home === "/" ? "" : home}`,
      ...lines,
      "",
    ].join("\n");
  };

  const body = `# ${SITE_NAME}

> Mezbaha ve et işleme sistemleri tasarımı ve imalatı.

${ENABLED_LOCALES.map(block).join("\n")}
## Site haritası
- ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
