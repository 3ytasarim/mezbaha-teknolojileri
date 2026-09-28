import { isPageAvailable, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";

/**
 * Menü etiketlerini dile çevirir: bağlantının iç yoluna göre sözlükteki etiket kullanılır (Türkçe sözlükte etiketler
 * zaten yönetimdeki Türkçe metinle aynıdır); sözlükte olmayan (yönetimden eklenmiş özel) bağlantı kendi etiketini korur.
 */
export function localizeNav<T extends { label: string; href: string }>(links: T[], locale: Locale, dict: Dictionary): T[] {
  return links.filter((l) => isPageAvailable(locale, l.href)).map((l) => ({ ...l, label: dict.nav[l.href] ?? l.label }));
}
