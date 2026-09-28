import type { Locale } from "../config";
import { tr, type Dictionary } from "./tr";
import { en } from "./en";
import { ru } from "./ru";
import { de } from "./de";
import { fr } from "./fr";
import { ar } from "./ar";

export type { Dictionary };
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K] };

const PARTIALS: Record<Exclude<Locale, "tr">, DeepPartial<Dictionary>> = { en, ru, de, fr, ar };

function merge<T extends Record<string, unknown>>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    const b = out[k];
    out[k] = b && typeof b === "object" && typeof v === "object" && !Array.isArray(b) && !Array.isArray(v) ? merge(b as Record<string, unknown>, v as DeepPartial<Record<string, unknown>>) : v;
  }
  return out as T;
}

/** Türkçe (kaynak) → İngilizce → dil: eksik anahtarlar bir önceki dile düşer. */
export function getDictionary(locale: Locale): Dictionary {
  if (locale === "tr") return tr;
  const withEn = merge(tr, en);
  return locale === "en" ? withEn : merge(withEn, PARTIALS[locale]);
}

/** "{name}" gibi yer tutucuları doldurur. */
export const format = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
