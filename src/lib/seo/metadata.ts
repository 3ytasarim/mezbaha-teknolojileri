import type { Metadata } from "next";
import { getSiteUrl, SITE_NAME } from "./site";
import { getLocalImageMeta } from "./image-meta";
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routes";
import { staticAlternates } from "@/lib/i18n/alternates";

/** Tüm sayfalar için yedek paylaşım görseli (projede mevcut hero varlığı). */
const DEFAULT_OG_IMAGE = "/images/hero/mezbaha-tesisi-hero.png";

/**
 * Kaynak sitedeki (Yoast) seoTitle değerleri sonlarında marka adını zaten taşıyor; layout
 * şablonu (%s | Marka) bir kez daha eklediğinde marka 2-3 kez tekrarlanıyordu.
 */
export function cleanTitle(title: string): string {
  const brand = SITE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*[-–—|]\\s*${brand}\\s*$`, "i");
  let out = title.trim();
  while (re.test(out) && out.replace(re, "").length > 0) out = out.replace(re, "").trim();
  return out;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
  type?: "website" | "article";
  /** Sayfanın dili (varsayılan Türkçe). `path` her zaman İÇ (Türkçe) yoldur; dile göre yerelleştirilir. */
  locale?: Locale;
  /**
   * Bu sayfanın diğer dillerdeki karşılıkları (hreflang): dil → o dilin GÖRÜNEN yolu (slug'ı dile özel olabildiği için
   * çağıran verir; ör. { tr: "/urun/x", en: "/en/product/y" }). Verilmezse hreflang yazılmaz.
   */
  alternates?: Partial<Record<Locale, string>> | false;
};

export async function buildMetadata({
  title: rawTitle,
  description,
  path,
  ogImage,
  noindex,
  type = "website",
  locale = DEFAULT_LOCALE,
  alternates: alternatesInput,
}: BuildMetadataInput): Promise<Metadata> {
  // Verilmezse (statik sayfalar) tüm etkin dillerde aynı iç yol varsayılır; varlık sayfaları kendi karşılıklarını verir; false = hreflang yok.
  const alternates = alternatesInput === false ? undefined : (alternatesInput ?? staticAlternates(path));
  const title = cleanTitle(rawTitle);
  const siteUrl = getSiteUrl();
  const url = new URL(localizePath(locale, path), siteUrl).toString();
  const languages = alternates
    ? {
        ...Object.fromEntries(Object.entries(alternates).map(([l, p]) => [l, new URL(p as string, siteUrl).toString()])),
        ...(alternates[DEFAULT_LOCALE] ? { "x-default": new URL(alternates[DEFAULT_LOCALE], siteUrl).toString() } : {}),
      }
    : undefined;
  const ogImagePath = ogImage || DEFAULT_OG_IMAGE;
  const image = new URL(ogImagePath, siteUrl).toString();
  // Gerçek dosya boyutu okunabiliyorsa OG image'a width/height/type eklenir (Mecanova audit §8); uydurma yok,
  // okunamayan/uzak görsellerde sadece url ile devam edilir.
  const imageMeta = await getLocalImageMeta(ogImagePath);

  return {
    title,
    description,
    alternates: { canonical: url, ...(languages ? { languages } : {}) },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: image, ...(imageMeta ? { width: imageMeta.width, height: imageMeta.height, type: imageMeta.type } : {}) }],
      locale: LOCALE_META[locale].ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
