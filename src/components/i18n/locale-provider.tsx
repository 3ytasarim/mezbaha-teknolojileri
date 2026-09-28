"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Ctx = { locale: Locale; dict: Dictionary | null };
const LocaleContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, dict: null });

/** Genel (public) düzenin dilini ve arayüz sözlüğünü istemci bileşenlerine iletir (Link, üst menü, dil seçici vb.). */
export function LocaleProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, dict }}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext).locale;

export function useDict(): Dictionary {
  const dict = useContext(LocaleContext).dict;
  if (!dict) throw new Error("useDict yalnızca LocaleProvider içinde kullanılabilir.");
  return dict;
}
