import { DEFAULT_LOCALE, ENABLED_LOCALES, isPageAvailable, type Locale } from "./config";
import { localizePath } from "./routes";

export type Alternates = Partial<Record<Locale, string>>;

/** Statik sayfa: tüm etkin dillerde aynı iç yol. Tek dil etkinse hreflang yazılmaz (undefined). */
export function staticAlternates(internalPath: string): Alternates | undefined {
  const present = ENABLED_LOCALES.filter((l) => isPageAvailable(l, internalPath));
  if (present.length < 2) return undefined;
  return Object.fromEntries(present.map((l) => [l, localizePath(l, internalPath)]));
}

/**
 * Çeviri tablolu varlık (ürün, blog...): `slugs` her dilin slug'ıdır (Türkçe = ana kayıt slug'ı). Yalnızca etkin ve slug'ı olan
 * diller yazılır; en az iki dil yoksa hreflang yazılmaz.
 */
export function entityAlternates(prefix: string, slugs: Alternates): Alternates | undefined {
  const present = ENABLED_LOCALES.filter((l) => slugs[l]);
  if (present.length < 2) return undefined;
  return Object.fromEntries(present.map((l) => [l, localizePath(l, `${prefix}/${slugs[l]}`)]));
}

export { DEFAULT_LOCALE };
