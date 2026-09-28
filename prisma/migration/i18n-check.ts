/**
 * Tamlık kontrolü: her dilin arayüz sözlüğünde Türkçe kaynağa göre eksik anahtarları listeler (İngilizce yedeği SAYILMAZ:
 * dil açılmadan önce ilgili sayfaların anahtarları o dilde gerçekten yazılmış olmalı). Sınırlı dillerde (LOCALE_PAGES) yalnızca
 * o sayfaların bölümleri zorunludur. Çıkış kodu 1 = eksik var. Kullanım: npm run i18n:check
 */
import { LOCALES, LOCALE_PAGES, CANONICAL_LOCALE, type Locale } from "../../src/lib/i18n/config";
import { tr } from "../../src/lib/i18n/dictionaries/tr";
import { en } from "../../src/lib/i18n/dictionaries/en";
import { ru } from "../../src/lib/i18n/dictionaries/ru";
import { de } from "../../src/lib/i18n/dictionaries/de";
import { fr } from "../../src/lib/i18n/dictionaries/fr";
import { ar } from "../../src/lib/i18n/dictionaries/ar";

const DICTS: Partial<Record<Locale, unknown>> = { en, ru, de, fr, ar };
// Sınırlı dillerde gereken üst düzey bölümler (home + iletisim + teklif-al + ortak parçalar)
const LIMITED_SECTIONS = ["common", "nav", "footer", "home", "contact", "quote", "forms", "ui"];

type Obj = Record<string, unknown>;
function missing(base: unknown, other: unknown, path = ""): string[] {
  if (Array.isArray(base)) return Array.isArray(other) && other.length === base.length ? base.flatMap((b, i) => missing(b, (other as unknown[])[i], `${path}[${i}]`)) : [`${path} (dizi boyutu/eksik)`];
  if (base && typeof base === "object") return Object.keys(base as Obj).flatMap((k) => missing((base as Obj)[k], other && typeof other === "object" ? (other as Obj)[k] : undefined, path ? `${path}.${k}` : k));
  return typeof other === "string" && other.trim() !== "" ? [] : [path];
}

let bad = false;
for (const l of LOCALES) {
  if (l === CANONICAL_LOCALE) continue;
  const limited = Boolean(LOCALE_PAGES[l]);
  const sections = limited ? LIMITED_SECTIONS : Object.keys(tr);
  // countryDefault bilerek boş olabilir
  const miss = sections.flatMap((s) => missing((tr as Obj)[s], (DICTS[l] as Obj)?.[s], s)).filter((p) => !p.endsWith("countryDefault") && p !== "footer.designBy" && !(limited && p.startsWith("ui.") && p !== "ui.breadcrumb" && p !== "ui.close"));
  console.log(`${l}${limited ? " (sınırlı: " + LOCALE_PAGES[l]!.join(", ") + ")" : ""}: ${miss.length === 0 ? "TAMAM" : `${miss.length} eksik`}`);
  if (miss.length) {
    bad = true;
    console.log("  " + miss.slice(0, 12).join("\n  ") + (miss.length > 12 ? `\n  … +${miss.length - 12}` : ""));
  }
}
process.exit(bad ? 1 : 0);
