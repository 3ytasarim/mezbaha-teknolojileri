import type { Locale } from "./config";

/**
 * Kapasite/alan gibi tek dilli kayıt alanlarını (ör. "50 büyükbaş + 100 koyun", "180 sheep/hour", "~350 m²") görüntülenen dile
 * çevirir. Türkçede metin aynen kalır. Yalnızca bilinen sözcükler çevrilir; tanınmayan parçalar olduğu gibi bırakılır.
 */
const TOKENS: Partial<Record<Locale, [RegExp, string][]>> = {
  en: [
    [/büyükbaş/gi, "cattle"], [/küçükbaş/gi, "small ruminants"], [/koyun/gi, "sheep"], [/domuz/gi, "pigs"], [/karkas/gi, "carcasses"],
    [/\/saat/gi, "/hour"], [/\/vardiya/gi, "/shift"],
  ],
  ru: [
    [/büyükbaş|\bcattle\b/gi, "голов КРС"], [/küçükbaş/gi, "голов МРС"], [/koyun|\bsheep\b/gi, "овец"], [/domuz|\bpig\b/gi, "свиней"],
    [/karkas|\bcarcass\b/gi, "туш"], [/\/saat|\/hour/gi, "/час"], [/\/vardiya|\/shift/gi, "/смену"], [/\bkg\b/gi, "кг"], [/\bm²/g, "м²"],
  ],
};

export function localizeMeasure(text: string | null | undefined, locale: Locale): string {
  if (!text) return "";
  const rules = TOKENS[locale];
  return rules ? rules.reduce((acc, [re, to]) => acc.replace(re, to), text) : text;
}
