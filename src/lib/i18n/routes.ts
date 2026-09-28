import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Yerelleştirilmiş URL parçaları. Dosya sistemindeki (iç) rota adları Türkçedir (urunler, urun, ...); dışarıya görünen
 * ilk-düzey parça dile göre değişir (ör. /tr/urunler, /ru/produkty). İngilizce (DEFAULT_LOCALE) önek almaz ama parça
 * çevirisi yine uygulanır (/urunler → /products). Kaynak: eski sitenin İngilizce/Rusça adresleri ve yaygın kullanım.
 * Ürün/blog/proje/kategori slug'ları ayrıca çeviri tablosundaki `slug` alanından gelir (docs/I18N_PLAN.md).
 */
export const SEGMENTS: Record<Locale, Record<string, string>> = {
  tr: {},
  en: { urunler: "products", urun: "product", projeler: "projects", blog: "blog", etiket: "tag", hakkimizda: "corporate", hizmetler: "services", iletisim: "contact-us", kataloglar: "catalogs", referanslar: "references", "teklif-al": "get-quote", videolar: "videos" },
  ru: { urunler: "produkty", urun: "produkt", projeler: "proekty", blog: "blog", etiket: "teg", hakkimizda: "kompaniya", hizmetler: "uslugi", iletisim: "nashi-kontakty", kataloglar: "katalogi", referanslar: "referencii", "teklif-al": "zapros-kp", videolar: "video" },
  de: { urunler: "produkte", urun: "produkt", projeler: "projekte", blog: "blog", etiket: "tag", hakkimizda: "ueber-uns", hizmetler: "leistungen", iletisim: "kontakt", kataloglar: "kataloge", referanslar: "referenzen", "teklif-al": "angebot-anfordern", videolar: "videos" },
  fr: { urunler: "produits", urun: "produit", projeler: "projets", blog: "blog", etiket: "tag", hakkimizda: "entreprise", hizmetler: "services", iletisim: "contact", kataloglar: "catalogues", referanslar: "references", "teklif-al": "demander-un-devis", videolar: "videos" },
  ar: { urunler: "products", urun: "product", projeler: "projects", blog: "blog", etiket: "tag", hakkimizda: "about", hizmetler: "services", iletisim: "contact", kataloglar: "catalogs", referanslar: "references", "teklif-al": "get-quote", videolar: "videos" },
};

const reverse = (locale: Locale) => Object.fromEntries(Object.entries(SEGMENTS[locale]).map(([internal, pub]) => [pub, internal]));

/**
 * İç (Türkçe) yolu, dilin görünen yoluna çevirir: localizePath("tr", "/urunler/kesim") → "/tr/urunler/kesim",
 * localizePath("en", "/urunler/kesim") → "/products/kesim" (DEFAULT_LOCALE önek almaz ama parça yine çevrilir).
 * Yalnızca ilk parça çevrilir; sonraki parçalar (slug) çağıran tarafından verilir.
 */
export function localizePath(locale: Locale, internalPath: string): string {
  const [pathOnly, ...rest] = internalPath.split(/(?=[?#])/);
  const parts = pathOnly.split("/").filter(Boolean);
  if (parts.length > 0) parts[0] = SEGMENTS[locale][parts[0]] ?? parts[0];
  const segments = locale === DEFAULT_LOCALE ? parts : [locale, ...parts];
  const localized = `/${segments.join("/")}`;
  return localized + rest.join("");
}

/**
 * Görünen yolu iç Türkçe yola çevirir: "/tr/urunler/x" → { locale: "tr", internalPath: "/urunler/x" };
 * "/products/x" (önek yok) → { locale: "en", internalPath: "/urunler/x" }.
 */
export function resolvePublicPath(pathname: string): { locale: Locale; internalPath: string } {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  const hasPrefix = Boolean(first) && isLocale(first) && first !== DEFAULT_LOCALE;
  const locale = hasPrefix ? (first as Locale) : DEFAULT_LOCALE;
  const rest = hasPrefix ? parts.slice(1) : [...parts];
  if (rest.length > 0) rest[0] = reverse(locale)[rest[0]] ?? rest[0];
  return { locale, internalPath: `/${rest.join("/")}` };
}
