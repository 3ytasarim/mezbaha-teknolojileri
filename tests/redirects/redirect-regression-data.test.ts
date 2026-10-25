import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkRedirectTable } from "../../src/lib/seo/redirect-guard";
import { readS101Csv } from "./helpers";

/**
 * S1-01 CSV'si (canlı tablonun düzeltme öncesi/sonrası görüntüsü) üzerinde, VERİTABANINA ve AĞA dokunmadan regresyon testi.
 * Canonical kümesi: düzeltme sonrası tüm hedefler (hepsi sitemap'te doğrulandı) + 7 gasp edilen canonical URL.
 */
const rows = readS101Csv();
const SEVEN = ["/products", "/contact-us", "/corporate", "/projects", "/catalogs", "/references", "/products/cattle-slaughterhouse"];
const canonical = new Set<string>([...SEVEN, ...rows.filter((r) => r.action !== "DEACTIVATE" && r.action !== "RESTORE_INACTIVE").map((r) => r.proposed_target)]);

const pre = rows.map((r) => ({ id: r.redirect_id, source: r.source_url, destination: r.current_target, active: r.current_active === "true" }));
const post = rows.map((r) => ({
  id: r.redirect_id,
  source: r.source_url,
  destination: r.proposed_target,
  active: r.action === "NO_CHANGE" ? true : r.expected_active === "true",
}));

describe("S1-01 CSV regresyon verisi", () => {
  it("fixture bütünlüğü: 370 kayıt (166 NO_CHANGE, 197 UPDATE_TARGET, 7 gasp)", () => {
    assert.equal(rows.length, 370);
    assert.equal(rows.filter((r) => r.action === "NO_CHANGE").length, 166);
    assert.equal(rows.filter((r) => r.action === "UPDATE_TARGET").length, 197);
    assert.equal(rows.filter((r) => ["DEACTIVATE", "RESTORE_INACTIVE"].includes(r.action)).length, 7);
  });
  it("düzeltme ÖNCESİ tablo: guard tam olarak 204 sorunlu kaydı yakalar (regresyon yakalanıyor)", () => {
    const bad = checkRedirectTable(pre, canonical);
    assert.equal(bad.length, 204);
    assert.equal(bad.filter((b) => b.issues.some((i) => i.code === "SOURCE_IS_CANONICAL")).length, 7);
    assert.equal(bad.filter((b) => b.issues.some((i) => i.code === "DEST_NOT_CANONICAL")).length, 204);
  });
  it("düzeltme SONRASI tablo: 363 aktif sayfa kuralı için 0 sorun — geçerli legacy redirect'ler engellenmez", () => {
    const active = post.filter((p) => p.active);
    assert.equal(active.length, 363);
    assert.deepEqual(checkRedirectTable(post, canonical), []);
  });
  it("değişmeyen 166 kural (eski WordPress dahil) tek tek temiz", () => {
    const keep = rows.filter((r) => r.action === "NO_CHANGE").map((r) => ({ id: r.redirect_id, source: r.source_url, destination: r.proposed_target, active: true }));
    assert.equal(keep.length, 166);
    assert.deepEqual(checkRedirectTable(keep, canonical), []);
    // WordPress tarzı kaynaklar (uzantısız tek-segment slug) örnekleri gerçekten dahil
    assert.ok(keep.some((k) => /^\/[a-z0-9-]+$/.test(k.source)));
  });
  it("güncellenecek 197 hedef: guard'ın hesapladığı canonical = önerilen hedef (EN 137, RU 60)", () => {
    const upd = rows.filter((r) => r.action === "UPDATE_TARGET");
    assert.equal(upd.filter((r) => r.language === "en").length, 137);
    assert.equal(upd.filter((r) => r.language === "ru").length, 60);
    const bad = checkRedirectTable(upd.map((r) => ({ id: r.redirect_id, source: r.source_url, destination: r.current_target, active: true })), canonical);
    assert.equal(bad.length, 197);
    for (const b of bad) {
      const want = upd.find((r) => r.redirect_id === b.id)!.proposed_target;
      assert.equal(b.issues.find((i) => i.code === "DEST_NOT_CANONICAL")?.suggestion, want, b.source);
    }
  });
  it("7 gasp edilen canonical: düzeltme sonrası pasif; aktif hâli engellenir", () => {
    for (const r of rows.filter((x) => ["DEACTIVATE", "RESTORE_INACTIVE"].includes(x.action))) {
      assert.equal(r.expected_active, "false", r.source_url);
      const reopened = checkRedirectTable([{ id: r.redirect_id, source: r.source_url, destination: r.current_target, active: true }], canonical);
      assert.equal(reopened.length, 1, r.source_url);
    }
  });
  it("hiçbir aktif kaynak, düzeltme sonrası hedeflerin canonical kümesinde değil (gasp yok)", () => {
    for (const p of post.filter((x) => x.active)) assert.ok(!canonical.has(p.source), p.source);
  });
});
