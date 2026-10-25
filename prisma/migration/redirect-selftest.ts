/**
 * redirect-guard.ts için birim testleri (veritabanı ve ağ yok). Çıkış kodu 1 = başarısız.
 * Kullanım: npm run redirects:selftest
 */
import assert from "node:assert/strict";
import { canonicalFormOf, checkRedirectRule, checkRedirectTable, localeOfPath } from "../../src/lib/seo/redirect-guard";

let passed = 0;
const t = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`FAIL  ${name}\n      ${(e as Error).message}`);
    process.exitCode = 1;
  }
};
const codes = (r: Parameters<typeof checkRedirectRule>[0], ctx?: Parameters<typeof checkRedirectRule>[1]) => checkRedirectRule(r, ctx).map((i) => i.code).sort();

// ---- canonicalFormOf: dile göre yerelleşmiş segmentler ----
t("EN iç yol → yerelleşmiş", () => {
  assert.equal(canonicalFormOf("/urun/bleeding-pan"), "/product/bleeding-pan");
  assert.equal(canonicalFormOf("/urunler"), "/products");
  assert.equal(canonicalFormOf("/iletisim"), "/contact-us");
  assert.equal(canonicalFormOf("/hakkimizda"), "/corporate");
  assert.equal(canonicalFormOf("/kataloglar/x"), "/catalogs/x");
});
t("EN canonical değişmez (idempotent)", () => {
  for (const p of ["/products", "/product/x", "/contact-us", "/corporate", "/projects", "/catalogs", "/references", "/videos", "/blog/x", "/"]) assert.equal(canonicalFormOf(p), p);
});
t("RU", () => {
  assert.equal(canonicalFormOf("/ru/urun/x"), "/ru/produkt/x");
  assert.equal(canonicalFormOf("/ru/produkt/x"), "/ru/produkt/x");
  assert.equal(canonicalFormOf("/ru/hakkimizda"), "/ru/kompaniya");
});
t("TR çevirisiz (iç yol = canonical)", () => {
  assert.equal(canonicalFormOf("/tr/urunler"), "/tr/urunler");
  assert.equal(canonicalFormOf("/tr/urun/x"), "/tr/urun/x");
});
t("sorgu/hash korunur, sondaki / atılır", () => {
  assert.equal(canonicalFormOf("/urunler?a=1"), "/products?a=1");
  assert.equal(canonicalFormOf("/products/"), "/products");
});
t("localeOfPath", () => {
  assert.equal(localeOfPath("/contact-us"), "en");
  assert.equal(localeOfPath("/ru/produkt/x"), "ru");
  assert.equal(localeOfPath("/tr/urunler"), "tr");
  assert.equal(localeOfPath("/de/produkte"), "de");
});

// ---- kural denetimi ----
const canonical = new Set(["/products", "/contact-us", "/corporate", "/product/x", "/ru/produkt/x", "/tr/urunler"]);
t("güncel canonical'ı kaynak yapmak engellenir (13 Ekim regresyonu)", () => {
  assert.deepEqual(codes({ source: "/contact-us", destination: "/iletisim" }, { canonicalPaths: canonical }), ["DEST_NOT_CANONICAL", "SOURCE_IS_CANONICAL"]);
  assert.deepEqual(codes({ source: "/products/", destination: "/urunler" }, { canonicalPaths: canonical }), ["DEST_NOT_CANONICAL", "SOURCE_IS_CANONICAL"]);
});
t("canonical olmayan hedef engellenir", () => {
  assert.deepEqual(codes({ source: "/bleeding-pan", destination: "/urun/bleeding-pan" }), ["DEST_NOT_CANONICAL"]);
  const [i] = checkRedirectRule({ source: "/bleeding-pan", destination: "/urun/bleeding-pan" });
  assert.equal(i.suggestion, "/product/bleeding-pan");
  assert.deepEqual(codes({ source: "/ru/eski", destination: "/ru/urun/x" }), ["DEST_NOT_CANONICAL"]);
});
t("doğru kural temiz", () => {
  assert.deepEqual(codes({ source: "/bleeding-pan", destination: "/product/bleeding-pan" }, { canonicalPaths: canonical }), []);
  assert.deepEqual(codes({ source: "/ru/eski", destination: "/ru/produkt/x" }, { canonicalPaths: canonical }), []);
  assert.deepEqual(codes({ source: "/tr/eski-sayfa/", destination: "/tr/urunler" }, { canonicalPaths: new Set() }), []);
});
t("dil değiştiren yönlendirme engellenir", () => {
  assert.deepEqual(codes({ source: "/ru/eski", destination: "/product/x" }), ["LOCALE_MISMATCH"]);
});
t("self / döngü", () => {
  assert.ok(codes({ source: "/a", destination: "/a/" }).includes("SELF"));
});
t("zincir (çıkış ve giriş)", () => {
  const rules = new Map([["/b", "/product/c"]]);
  assert.ok(codes({ source: "/a", destination: "/b" }, { activeRules: rules }).includes("CHAIN_OUT"));
  assert.ok(codes({ source: "/b", destination: "/product/c" }, { activeRules: new Map([["/a", "/b"]]) }).includes("CHAIN_IN"));
});
t("pasif kural denetlenmez", () => {
  assert.deepEqual(codes({ source: "/contact-us", destination: "/iletisim", active: false }, { canonicalPaths: canonical }), []);
});
t("harici (https) hedef serbest; ama canonical kaynak yine engellenir", () => {
  assert.deepEqual(codes({ source: "/eski", destination: "https://example.com/x" }, { canonicalPaths: canonical }), []);
  assert.deepEqual(codes({ source: "/products", destination: "https://example.com/x" }, { canonicalPaths: canonical }), ["SOURCE_IS_CANONICAL"]);
});
t("checkRedirectTable: yalnız aktif ve sorunlu kuralları döndürür", () => {
  const out = checkRedirectTable(
    [
      { id: "1", source: "/contact-us", destination: "/iletisim", active: true },
      { id: "2", source: "/old", destination: "/product/x", active: true },
      { id: "3", source: "/pasif", destination: "/urun/x", active: false },
    ],
    canonical,
  );
  assert.deepEqual(out.map((o) => o.id), ["1"]);
});

console.log(process.exitCode ? "BAŞARISIZ" : `redirect-guard: ${passed} test geçti`);
