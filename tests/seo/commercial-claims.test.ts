import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { findClaims, findGatedTerms } from "../../src/lib/seo/commercial-claims";
import { SCOPE_STATEMENT_EN } from "../../src/lib/seo/scope-statement";
import { getDictionary } from "../../src/lib/i18n/dictionaries";

/**
 * Mezbaha Teknolojileri mezbaha makineleri/ekipmanları SUNAR; anahtar teslim, tesis inşaatı, kurulum veya devreye alma
 * hizmeti vermez. Hangi makinelerin kendi üretimi olduğu ürün bazında doğrulanmadı → "manufacturer" iddiası yok.
 * Kodda yaşayan İngilizce içerik (sözlük + ana sayfa SEO metni) bu iddiaları taşımamalıdır. (DB içeriği için: npm run seo:claims.)
 */
const walk = (o: unknown, p: string, out: { path: string; text: string }[]) => {
  if (typeof o === "string") out.push({ path: p, text: o });
  else if (Array.isArray(o)) o.forEach((x, i) => walk(x, `${p}[${i}]`, out));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, p ? `${p}.${k}` : k, out);
};
const homeSeo = () => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "src", "content", "legacy", "home-seo.json"), "utf8")).locales.en as string;
const enItems = () => { const items: { path: string; text: string }[] = []; walk(getDictionary("en"), "", items); return items; };

describe("EN içerik: ticari iddia denetimi", () => {
  it("sözlük (en): anahtar teslim/kurulum/devreye alma/tesis tasarımı iddiası YOK (istisna yok)", () => {
    const bad = enItems().flatMap((i) => findClaims(i.text).map((h) => `${i.path}: «${h.match}» (${h.rule})`));
    assert.deepEqual(bad, []);
  });
  it("ana sayfa SEO metni (home-seo.json, en) temiz", () => {
    assert.deepEqual(findClaims(homeSeo()).map((h) => `${h.match} (${h.rule})`), []);
  });
  it("katalog dışı ürün/hizmet anılmaz", () => {
    for (const forbidden of [/scalder/i, /defeather/i, /\bERP\b/, /packaging machine/i, /chiller/i, /traceability software/i, /mezbahane/i, /equipments/i]) assert.doesNotMatch(homeSeo(), forbidden);
  });
  it("ana sayfa meta (geçici fallback): title ≤ 65, description ≤ 160, 'Equipment & Machinery', manufacturer yok", () => {
    const m = getDictionary("en").home.meta;
    assert.equal(m.title, "Slaughterhouse Equipment & Machinery | Mezbaha Teknolojileri");
    assert.ok(m.title.length <= 65);
    assert.ok(m.description.length <= 160, String(m.description.length));
    assert.doesNotMatch(m.description, /manufactur/i);
    assert.equal(getDictionary("en").home.hero.headline, "Slaughterhouse Equipment & Machinery");
  });
  it("kapsam cümlesi: hero alanında ASLA yok; sayfada ya hiç yok (A1) ya da onaylı metnin birebir aynısı (A2)", () => {
    const d = getDictionary("en");
    const hero = JSON.stringify(d.home.hero);
    assert.doesNotMatch(hero, /do not provide|plant construction|commissioning/i);
    const t = homeSeo();
    const mentions = /plant construction|commissioning/i.test(t);
    if (mentions) assert.ok(t.includes(SCOPE_STATEMENT_EN), "olumsuz kapsam anılıyorsa onaylı metin birebir kullanılmalı");
    // olumsuz kapsam cümlesi başka hiçbir sözlük anahtarında geçmez (yalnızca ana sayfa SEO metni/ürün tedarik kapsamı)
    for (const i of enItems()) assert.doesNotMatch(i.text, /do not (provide|offer) plant construction/i, i.path);
  });
  it("onaylı kapsam cümlesi iddia sayılmaz ve metni değişmez", () => {
    assert.equal(SCOPE_STATEMENT_EN, "We supply slaughterhouse equipment and machinery. We do not provide plant construction, installation, or commissioning services.");
    assert.equal(findClaims(SCOPE_STATEMENT_EN).length, 0);
  });
  it("denetçi gerçek iddiaları yakalar (negatif kontrol)", () => {
    for (const bad of [
      "Plants installed and commissioned across Turkey.",
      "Get a turnkey slaughterhouse quote",
      "mini slaughterhouse systems for small businesses, with professional installation and commissioning.",
      "Capacity-specific slaughterhouse building and line design.",
      "Leader in slaughterhouse automation systems.",
      "USDA approved equipment",
    ]) assert.ok(findClaims(bad).length > 0, bad);
  });
});

describe("EN içerik: teyit bekleyen ifadeler (üretici/tedarikçi, hide puller)", () => {
  it("sözlük ve ana sayfa SEO metni: hide-puller, ürün bazında üretim ve 'manufacturer' iddiası içermez", () => {
    const items = enItems();
    items.push({ path: "home-seo.en", text: homeSeo() });
    const bad = items.flatMap((i) => findGatedTerms(i.text).map((h) => `${i.path}: «${h.match}» (${h.id})`));
    assert.deepEqual(bad, []);
  });
  it("kapı kuralları gerçek örnekleri yakalar", () => {
    assert.ok(findGatedTerms("Hydraulic Hide Puller for cattle").length > 0);
    assert.ok(findGatedTerms("We manufacture stunning boxes, saws and platforms.").length > 0);
    assert.ok(findGatedTerms("Slaughterhouse equipment manufacturer based in Dilovası, Turkey.").length > 0);
    assert.ok(findGatedTerms("Equipment is manufactured in our own workshop.").length > 0);
    assert.equal(findGatedTerms("We supply slaughterhouse equipment and machinery.").length, 0);
  });
  it("ana sayfa SEO metni: bölüm başlıkları olumsuz/yanlış anahtar kelime içermez", () => {
    const heads = [...homeSeo().matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1]);
    assert.ok(heads.length >= 4);
    for (const h of heads) assert.doesNotMatch(h, /plant construction|turnkey|installation|commissioning/i, h);
  });
});
