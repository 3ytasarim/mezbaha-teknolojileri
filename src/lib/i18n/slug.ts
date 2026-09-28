import { CANONICAL_LOCALE, type Locale } from "./config";

/** Kaydın dile göre URL slug'ı: Türkçede ana kayıt slug'ı, diğer dillerde çeviri tablosundaki `slug` (yoksa ana slug). */
export function slugOf(entity: { slug: string; translations: { slug?: string | null }[] }, locale: Locale): string {
  return locale === CANONICAL_LOCALE ? entity.slug : (entity.translations[0]?.slug ?? entity.slug);
}
