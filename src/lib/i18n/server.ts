import "server-only";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, LANG_HEADER, isEnabledLocale, type Locale } from "./config";

/** İstekteki dil (proxy'nin `x-lang` başlığı); yoksa varsayılan Türkçe. */
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get(LANG_HEADER);
  return isEnabledLocale(value) ? value : DEFAULT_LOCALE;
}

/** Sunucu bileşenleri için geçerli dilin arayüz sözlüğü. */
export async function getDict() {
  const { getDictionary } = await import("./dictionaries");
  return getDictionary(await getLocale());
}

/** Sunucu bileşenleri için dil + sözlük birlikte: const { locale, d } = await getI18n(). */
export async function getI18n() {
  const { getDictionary } = await import("./dictionaries");
  const locale = await getLocale();
  return { locale, d: getDictionary(locale) };
}
