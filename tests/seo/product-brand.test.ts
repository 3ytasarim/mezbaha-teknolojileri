import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { productJsonLd } from "../../src/lib/seo/json-ld";
import { isVerifiedOwnBrand, VERIFIED_OWN_BRAND_PRODUCT_SLUGS } from "../../src/lib/seo/product-brand";

/** Üretici/tedarikçi ürün bazında doğrulanana kadar hiçbir Product şeması `brand` yayımlamaz. */
describe("Product JSON-LD brand", () => {
  const base = { name: "X", description: "d", path: "/product/x", images: ["/a.png"] };
  it("brandRef verilmediyse/false ise brand alanı yok", () => {
    assert.equal("brand" in productJsonLd(base), false);
    assert.equal("brand" in productJsonLd({ ...base, brandRef: false }), false);
  });
  it("doğrulanmış marka listesi şimdilik boş: hiçbir ürün için brand yayımlanmaz", () => {
    assert.equal(VERIFIED_OWN_BRAND_PRODUCT_SLUGS.size, 0);
    assert.equal(isVerifiedOwnBrand("karkas-bolme-testeresi"), false);
  });
  it("ürün sayfası brandRef'i sabit true ile vermez, allowlist'ten türetir", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "src", "app", "(public)", "urun", "[slug]", "page.tsx"), "utf8");
    assert.doesNotMatch(src, /brandRef:\s*true/);
    assert.match(src, /brandRef:\s*isVerifiedOwnBrand\(product\.slug\)/);
  });
  it("liste doldurulursa (teyit sonrası) brand Organization'a referans verir", () => {
    const j = productJsonLd({ ...base, brandRef: true }) as { brand?: { "@id": string } };
    assert.ok(j.brand?.["@id"].endsWith("#organization"));
  });
});
