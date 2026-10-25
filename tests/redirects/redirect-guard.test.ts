import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canonicalFormOf, checkRedirectRule, checkRedirectTable, localeOfPath } from "../../src/lib/seo/redirect-guard";
import { CANONICAL_FIXTURE } from "./helpers";

const codes = (r: Parameters<typeof checkRedirectRule>[0], ctx?: Parameters<typeof checkRedirectRule>[1]) => checkRedirectRule(r, ctx).map((i) => i.code).sort();
const ctx = { canonicalPaths: CANONICAL_FIXTURE };

describe("canonical biçim (lokalize segmentler, normalizasyon)", () => {
  it("EN iç yol → yerelleşmiş", () => {
    assert.equal(canonicalFormOf("/urun/bleeding-pan"), "/product/bleeding-pan");
    assert.equal(canonicalFormOf("/urunler/cattle-slaughterhouse"), "/products/cattle-slaughterhouse");
    assert.equal(canonicalFormOf("/iletisim"), "/contact-us");
  });
  it("canonical biçim idempotent", () => {
    for (const p of CANONICAL_FIXTURE) assert.equal(canonicalFormOf(p), p, p);
  });
  it("RU / TR / sorgu / sondaki slash", () => {
    assert.equal(canonicalFormOf("/ru/urun/x"), "/ru/produkt/x");
    assert.equal(canonicalFormOf("/tr/urun/x"), "/tr/urun/x");
    assert.equal(canonicalFormOf("/urunler?a=1"), "/products?a=1");
    assert.equal(canonicalFormOf("/products/"), "/products");
  });
  it("dil tespiti", () => {
    assert.equal(localeOfPath("/contact-us"), "en");
    assert.equal(localeOfPath("/en/eski-wp-yazisi"), "en");
    assert.equal(localeOfPath("/ru/produkty"), "ru");
    assert.equal(localeOfPath("/tr/urunler"), "tr");
  });
});

describe("geçerli yönlendirmeler engellenmez (legacy / eski WordPress)", () => {
  it("eski WP slug → canonical ürün/kategori/katalog", () => {
    assert.deepEqual(codes({ source: "/bleeding-pan", destination: "/product/bleeding-pan" }, ctx), []);
    assert.deepEqual(codes({ source: "/slaughterhouse-equipments", destination: "/products/cattle-slaughterhouse" }, ctx), []);
    assert.deepEqual(codes({ source: "/2018-slaughterhouse-catalog", destination: "/catalogs" }, ctx), []);
    assert.deepEqual(codes({ source: "/ru/oborudovanie-mezbaha", destination: "/ru/produkty/skotobojnya" }, ctx), []);
    assert.deepEqual(codes({ source: "/tr/eski-sayfa/", destination: "/tr/urunler" }, ctx), []);
  });
  it("/en/ önekli eski adresler (EN varsayılan dil)", () => {
    assert.deepEqual(codes({ source: "/en/bleeding-pan", destination: "/product/bleeding-pan" }, ctx), []);
  });
  it("Türkçe iç yol kaynak olarak serbest (canonical değil)", () => {
    assert.deepEqual(codes({ source: "/urunler", destination: "/products" }, ctx), []);
  });
  it("harici hedef ve asset kuralları serbest", () => {
    assert.deepEqual(codes({ source: "/eski", destination: "https://example.com/x" }, ctx), []);
    assert.deepEqual(codes({ source: "/images/eski.jpg", destination: "/uploads/yeni.jpg" }, ctx), []);
  });
  it("sorgu dizesi / hash içeren hedef", () => {
    assert.deepEqual(codes({ source: "/eski", destination: "/products?x=1#a" }, ctx), []);
  });
});

describe("hatalı kurallar engellenir", () => {
  it("canonical URL redirect kaynağı olamaz (13 Ekim regresyonu: 7 URL)", () => {
    for (const s of ["/products", "/contact-us", "/corporate", "/projects", "/catalogs", "/references", "/products/cattle-slaughterhouse"]) {
      assert.ok(codes({ source: s, destination: "/iletisim" }, ctx).includes("SOURCE_IS_CANONICAL"), s);
      assert.ok(codes({ source: s + "/", destination: "/x" }, ctx).includes("SOURCE_IS_CANONICAL"), s + "/");
    }
  });
  it("mevcut ürün ve kategori URL'leri kaynak olarak korunur", () => {
    for (const s of ["/product/slaughterhouse-hook", "/products/sheep-slaughterhouse", "/ru/produkt/krjuk-dlja-uboja", "/tr/urun/kesim-kancasi"]) {
      assert.ok(codes({ source: s, destination: "/products" }, ctx).includes("SOURCE_IS_CANONICAL"), s);
    }
  });
  it("harici hedefe bile olsa canonical kaynak engellenir", () => {
    assert.deepEqual(codes({ source: "/products", destination: "https://example.com" }, ctx), ["SOURCE_IS_CANONICAL"]);
  });
  it("canonical olmayan hedef + öneri", () => {
    const [i] = checkRedirectRule({ source: "/bleeding-pan", destination: "/urun/bleeding-pan" }, ctx);
    assert.equal(i.code, "DEST_NOT_CANONICAL");
    assert.equal(i.suggestion, "/product/bleeding-pan");
    assert.match(i.message, /\/product\/bleeding-pan/);
    assert.ok(codes({ source: "/ru/eski", destination: "/ru/urun/x" }, ctx).includes("DEST_NOT_CANONICAL"));
  });
  it("dil uyumu", () => {
    assert.deepEqual(codes({ source: "/ru/eski", destination: "/product/x" }, ctx), ["LOCALE_MISMATCH"]);
    assert.deepEqual(codes({ source: "/eski", destination: "/ru/produkty" }, ctx), ["LOCALE_MISMATCH"]);
    assert.deepEqual(codes({ source: "/tr/eski", destination: "/products" }, ctx), ["LOCALE_MISMATCH"]);
  });
  it("kendine yönlendirme", () => {
    assert.deepEqual(codes({ source: "/a", destination: "/a/" }), ["SELF"]);
  });
  it("zincir: çıkış (hedef başka kuralın kaynağı) ve giriş (kaynağa işaret eden kural)", () => {
    const out = checkRedirectRule({ source: "/a", destination: "/b" }, { activeRules: new Map([["/b", "/product/c"]]) });
    assert.ok(out.some((i) => i.code === "CHAIN_OUT" && i.suggestion === "/product/c"));
    assert.ok(codes({ source: "/b", destination: "/product/c" }, { activeRules: new Map([["/a", "/b"]]) }).includes("CHAIN_IN"));
  });
  it("döngü: A→B→A ve A→B→C→A", () => {
    assert.ok(codes({ source: "/a", destination: "/b" }, { activeRules: new Map([["/b", "/a"]]) }).includes("LOOP"));
    assert.ok(codes({ source: "/a", destination: "/b" }, { activeRules: new Map([["/b", "/c"], ["/c", "/a"]]) }).includes("LOOP"));
  });
  it("çakışan kaynak (aktif/pasif fark etmez; slash normalizasyonu)", () => {
    assert.deepEqual(codes({ source: "/eski/", destination: "/products" }, { otherSources: new Set(["/eski"]) }), ["DUPLICATE_SOURCE"]);
    assert.deepEqual(codes({ source: "/eski", destination: "/products", active: false }, { otherSources: new Set(["/eski"]) }), ["DUPLICATE_SOURCE"]);
  });
  it("pasif kural diğer denetimlerden muaf (yeniden açılırken tam denetim)", () => {
    assert.deepEqual(codes({ source: "/contact-us", destination: "/iletisim", active: false }, ctx), []);
    assert.ok(codes({ source: "/contact-us", destination: "/iletisim", active: true }, ctx).length > 0);
  });
});

describe("mesajlar (yönetici arayüzünde olduğu gibi gösterilir)", () => {
  it("canonical kaynak mesajı", () => {
    const [i] = checkRedirectRule({ source: "/contact-us", destination: "/iletisim" }, ctx);
    assert.match(i.message, /zaten canonical bir sayfaya ait/);
    assert.match(i.message, /Redirect oluşturulamaz/);
  });
  it("zincir mesajı", () => {
    const [i] = checkRedirectRule({ source: "/a", destination: "/b" }, { activeRules: new Map([["/b", "/product/c"]]) });
    assert.match(i.message, /zincir oluşturacağı için kaydedilemedi/);
  });
});

describe("tablo denetimi", () => {
  it("yalnız sorunlu kayıtları döndürür; kopya kaynakları işaretler", () => {
    const out = checkRedirectTable(
      [
        { id: "1", source: "/contact-us", destination: "/iletisim", active: true },
        { id: "2", source: "/old", destination: "/product/x", active: true },
        { id: "3", source: "/pasif", destination: "/urun/x", active: false },
        { id: "4", source: "/dup", destination: "/products", active: true },
        { id: "5", source: "/dup/", destination: "/products", active: false },
      ],
      CANONICAL_FIXTURE,
    );
    assert.deepEqual(out.map((o) => o.id).sort(), ["1", "4", "5"]);
  });
});
