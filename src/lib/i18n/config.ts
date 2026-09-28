/**
 * Çok dilli site ayarları (docs/I18N_PLAN.md). İngilizce varsayılandır ve URL öneki almaz (/products);
 * diğer diller önek alır (/tr/urunler). Bir dil ENABLED_LOCALES'a eklenene kadar proxy onu yönlendirmez
 * (o dilin öneki 404 verir) — sayfalar/sorgular o dile hazır olmadan içeriğin başka URL'de yayınlanmasını önler.
 *
 * DEFAULT_LOCALE ile CANONICAL_LOCALE FARKLI kavramlardır:
 *  - DEFAULT_LOCALE: URL öneki almayan dil (routing). Şu an İngilizce.
 *  - CANONICAL_LOCALE: Veritabanının taban tablolarında (Product.name, slug, ...) doğrudan saklanan dil — her zaman
 *    Türkçe, admin panelindeki normal formlar (Ürünler/Projeler/Blog) bu dili düzenler. Çeviriler paneli diğer tüm
 *    dilleri (CANONICAL_LOCALE hariç) yönetir. Bu iki sabit birbirinden bağımsız değişir; birini diğeriyle karıştırmayın.
 */
export const LOCALES = ["tr", "en", "ru", "de", "fr", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Verinin taban tablolarda doğrudan saklandığı dil (bkz. üstteki not). Routing varsayılanından bağımsızdır. */
export const CANONICAL_LOCALE: Locale = "tr";

/** Yayında olan diller. Yeni dil, içerik + arayüz hazır olunca buraya eklenir. */
export const ENABLED_LOCALES: readonly Locale[] = ["tr", "en", "ru", "de", "fr", "ar"];

/**
 * Yalnızca belirli sayfaları olan diller (eski sitede bu dillerde yalnızca ana sayfa vardı). Listede olmayan iç yollar bu dilde
 * yoktur: proxy 404 verir, menü/sitemap/hreflang/dil seçici onları içermez. Listelenmeyen dillerde tüm sayfalar vardır.
 */
export const LOCALE_PAGES: Partial<Record<Locale, readonly string[]>> = {};

/** İç (Türkçe) yol bu dilde yayınlanıyor mu? Alt yollar (ör. /urun/x) ana bölüm listede değilse yoktur. */
export function isPageAvailable(locale: Locale, internalPath: string): boolean {
  const allowed = LOCALE_PAGES[locale];
  if (!allowed) return true;
  const path = internalPath.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return allowed.includes(path);
}

export const RTL_LOCALES: readonly Locale[] = ["ar"];

export const LOCALE_META: Record<Locale, { label: string; nativeName: string; ogLocale: string; intl: string }> = {
  tr: { label: "TR", nativeName: "Türkçe", ogLocale: "tr_TR", intl: "tr-TR" },
  en: { label: "EN", nativeName: "English", ogLocale: "en_US", intl: "en-US" },
  ru: { label: "RU", nativeName: "Русский", ogLocale: "ru_RU", intl: "ru-RU" },
  de: { label: "DE", nativeName: "Deutsch", ogLocale: "de_DE", intl: "de-DE" },
  fr: { label: "FR", nativeName: "Français", ogLocale: "fr_FR", intl: "fr-FR" },
  ar: { label: "AR", nativeName: "العربية", ogLocale: "ar_AR", intl: "ar" },
};

export const isLocale = (value: string | undefined | null): value is Locale => !!value && (LOCALES as readonly string[]).includes(value);
export const isEnabledLocale = (value: string | undefined | null): value is Locale => isLocale(value) && ENABLED_LOCALES.includes(value);
export const dirOf = (locale: Locale): "ltr" | "rtl" => (RTL_LOCALES.includes(locale) ? "rtl" : "ltr");

/** Proxy'nin sayfaya ilettiği istek başlığı (dil). */
export const LANG_HEADER = "x-lang";
