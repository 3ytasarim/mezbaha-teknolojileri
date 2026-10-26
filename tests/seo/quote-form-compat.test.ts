import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDictionary } from "../../src/lib/i18n/dictionaries";

/**
 * Teklif formu etiket değişikliği (EN "Equipment for a New Slaughterhouse") YALNIZCA görüntü etiketidir.
 * Kayıt değerleri (DB, e-posta bildirimi, yönetici ekranı) Türkçe sabit anahtarlardır ve DEĞİŞMEZ → eski kayıtlarla geriye dönük uyumlu.
 */
const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", "..", ...p), "utf8");
const KEYS = ["Yeni mezbaha kurulumu", "Mevcut tesise ekipman", "Modernizasyon / yenileme", "Diğer"];
const arr = (src: string) => [...(src.match(/const PROJECT_TYPES = \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);

describe("teklif formu: etiket değişikliği geriye dönük uyumlu", () => {
  const form = read("src", "components", "public", "quote-form.tsx");
  const action = read("src", "app", "(public)", "teklif-al", "actions.ts");
  it("kayıt anahtarları (form + sunucu doğrulaması) değişmedi ve birbiriyle aynı", () => {
    assert.deepEqual(arr(form), KEYS);
    assert.deepEqual(arr(action), KEYS);
  });
  it("seçenek DEĞERİ anahtardır, etiket sözlükten gelir", () => {
    assert.match(form, /<option key=\{type\} value=\{type\}>\s*\{f\.projectTypes\[i\] \?\? type\}/);
  });
  it("sunucu yalnızca anahtarları kabul eder (z.enum) ve bildirime/DB'ye anahtarı yazar; etiketi değil", () => {
    assert.match(action, /projectType: z\.enum\(PROJECT_TYPES\)\.optional\(\)/);
    assert.match(action, /value: data\.projectType/);
    assert.doesNotMatch(action, /projectTypes\[/); // etiket dizisine hiç dokunmaz
  });
  it("yönetici ekranı kaydı olduğu gibi (anahtar) gösterir", () => {
    assert.match(read("src", "app", "admin", "(protected)", "talepler", "teklif", "page.tsx"), /\{q\.projectType\}/);
  });
  it("6 dilde de 4 etiket var (sıra = anahtar sırası); yalnız EN[0] değişti", () => {
    const L = (l: "tr" | "en" | "ru" | "de" | "fr" | "ar") => getDictionary(l).forms.projectTypes;
    for (const l of ["tr", "en", "ru", "de", "fr", "ar"] as const) assert.equal(L(l).length, 4, l);
    assert.deepEqual(L("en"), ["Equipment for a New Slaughterhouse", "Equipment for an existing plant", "Modernization / renovation", "Other"]);
    assert.deepEqual(L("tr"), KEYS);
    assert.equal(L("de")[0], "Neuer Schlachthof");
    assert.equal(L("fr")[0], "Construction d'un nouvel abattoir"); // diğer dil: değiştirilmedi, raporlandı
    assert.equal(L("ar")[0], "إنشاء مسلخ جديد"); // diğer dil: değiştirilmedi, raporlandı
    assert.equal(L("ru")[0], "Новая скотобойня");
  });
});
