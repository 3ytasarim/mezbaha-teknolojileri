import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { saveRedirect, toggleRedirect, type RedirectInput } from "../../src/lib/seo/redirect-service";
import { MemStore, provider, rule } from "./helpers";

const input = (sourcePath: string, destinationPath: string, active = true): RedirectInput => ({ sourcePath, destinationPath, statusCode: 301, active });
const save = (store: MemStore, i: RedirectInput, id?: string, canonical = provider()) => saveRedirect({ store, canonical, input: i, id });

describe("saveRedirect: geçerli kayıtlar", () => {
  it("geçerli 301 (eski WP slug → canonical ürün) kaydedilir", async () => {
    const store = new MemStore();
    const r = await save(store, input("/bleeding-pan", "/product/bleeding-pan"));
    assert.equal(r.ok, true);
    assert.equal(store.rows.length, 1);
    assert.equal(store.rows[0].statusCode, 301);
  });
  it("sondaki slash normalize edilir", async () => {
    const store = new MemStore();
    await save(store, input("/eski-sayfa/", "/products"));
    assert.equal(store.rows[0].sourcePath, "/eski-sayfa");
  });
  it("mevcut kaydın güncellenmesi (kendi kaynağıyla çakışmaz)", async () => {
    const store = new MemStore([rule("/eski", "/products")]);
    const r = await save(store, input("/eski", "/projects"), store.rows[0].id);
    assert.equal(r.ok, true);
    assert.equal(store.rows[0].destinationPath, "/projects");
  });
  it("pasif kayıt canonical listesi olmadan da kaydedilebilir; ama kopya kaynak yine engellenir", async () => {
    const store = new MemStore([rule("/eski", "/products")]);
    assert.equal((await save(store, input("/contact-us", "/iletisim", false), undefined, provider(null))).ok, true);
    const dup = await save(store, input("/eski", "/projects", false));
    assert.equal(dup.ok, false);
    assert.equal(!dup.ok && dup.code, "DUPLICATE_SOURCE");
  });
});

describe("saveRedirect: sunucu tarafı doğrulama ve Türkçe mesajlar", () => {
  it("canonical URL redirect kaynağı olamaz — hiçbir şey yazılmaz", async () => {
    const store = new MemStore();
    const r = await save(store, input("/contact-us", "/iletisim"));
    assert.equal(r.ok, false);
    assert.match(!r.ok ? r.error : "", /zaten canonical bir sayfaya ait/);
    assert.match(!r.ok ? r.error : "", /Redirect oluşturulamaz/);
    assert.equal(store.rows.length, 0);
  });
  it("canonical olmayan hedef engellenir ve doğru adres önerilir", async () => {
    const store = new MemStore();
    const r = await save(store, input("/blood-tank-eski", "/urun/blood-tank"));
    assert.equal(r.ok, false);
    assert.match(!r.ok ? r.error : "", /\/product\/blood-tank/);
    assert.equal(store.rows.length, 0);
  });
  it("yanlış dile yönlendirme engellenir", async () => {
    const r = await save(new MemStore(), input("/ru/eski", "/product/blood-tank"));
    assert.equal(!r.ok && r.code, "LOCALE_MISMATCH");
  });
  it("zincir: mevcut kuralın kaynağına yönlendirme", async () => {
    const store = new MemStore([rule("/b", "/product/blood-tank")]);
    const r = await save(store, input("/a", "/b"));
    assert.equal(!r.ok && r.code, "CHAIN_OUT");
    assert.match(!r.ok ? r.error : "", /zincir oluşturacağı için kaydedilemedi/);
    assert.equal(store.rows.length, 1);
  });
  it("zincir: yeni kaynağa zaten işaret eden kural var", async () => {
    const store = new MemStore([rule("/a", "/b")]);
    const r = await save(store, input("/b", "/product/blood-tank"));
    assert.equal(!r.ok && r.code, "CHAIN_IN");
  });
  it("döngü A→B, B→A", async () => {
    const store = new MemStore([rule("/b", "/a")]);
    const r = await save(store, input("/a", "/b"));
    assert.equal(!r.ok && r.code, "LOOP");
    assert.match(!r.ok ? r.error : "", /döngü oluşturacağı için kaydedilemedi/);
  });
  it("aynı kaynak için çakışan kural", async () => {
    const store = new MemStore([rule("/eski", "/products")]);
    const r = await save(store, input("/eski/", "/projects"));
    assert.equal(!r.ok && r.code, "DUPLICATE_SOURCE");
    assert.equal(store.rows.length, 1);
  });
  it("güncellemede de aynı denetim (var olan kaydı hatalı hedefe çevirme)", async () => {
    const store = new MemStore([rule("/eski", "/products")]);
    const r = await save(store, input("/eski", "/urunler"), store.rows[0].id);
    assert.equal(r.ok, false);
    assert.equal(store.rows[0].destinationPath, "/products"); // değişmedi
  });
  it("olmayan kaydı güncelleme", async () => {
    const r = await save(new MemStore(), input("/x", "/products"), "yok");
    assert.equal(!r.ok && r.code, "NOT_FOUND");
  });
  it("canonical listesi üretilemezse AKTİF kayıt reddedilir (fail-closed)", async () => {
    const store = new MemStore();
    const r = await save(store, input("/eski", "/products"), undefined, provider(null));
    assert.equal(!r.ok && r.code, "VERIFICATION_UNAVAILABLE");
    assert.equal(store.rows.length, 0);
    const thrown = await saveRedirect({ store, canonical: async () => { throw new Error("db"); }, input: input("/eski", "/products") });
    assert.equal(!thrown.ok && thrown.code, "VERIFICATION_UNAVAILABLE");
  });
});

describe("toggleRedirect: pasif hatalı kuralın yeniden açılması", () => {
  it("13 Ekim senaryosu: pasif self-redirect/iç yol kuralı canonical kaynakta açılamaz", async () => {
    const store = new MemStore([rule("/contact-us", "/iletisim", false)]);
    const r = await toggleRedirect({ store, canonical: provider(), id: store.rows[0].id });
    assert.equal(r.ok, false);
    assert.match(!r.ok ? r.error : "", /zaten canonical bir sayfaya ait/);
    assert.equal(store.rows[0].active, false); // sessiz değil: hata döner, kayıt pasif kalır
  });
  it("canonical olmayan hedefli pasif kural açılamaz", async () => {
    const store = new MemStore([rule("/eski", "/urun/blood-tank", false)]);
    const r = await toggleRedirect({ store, canonical: provider(), id: store.rows[0].id });
    assert.equal(!r.ok && r.code, "DEST_NOT_CANONICAL");
    assert.equal(store.rows[0].active, false);
  });
  it("geçerli pasif kural açılır; sonra kapatılır (kapatma her zaman serbest)", async () => {
    const store = new MemStore([rule("/eski", "/products", false)]);
    const id = store.rows[0].id;
    assert.equal((await toggleRedirect({ store, canonical: provider(), id })).ok, true);
    assert.equal(store.rows[0].active, true);
    assert.equal((await toggleRedirect({ store, canonical: provider(null), id })).ok, true); // canonical gerekmez
    assert.equal(store.rows[0].active, false);
  });
  it("açarken canonical listesi yoksa reddedilir", async () => {
    const store = new MemStore([rule("/eski", "/products", false)]);
    const r = await toggleRedirect({ store, canonical: provider(null), id: store.rows[0].id });
    assert.equal(!r.ok && r.code, "VERIFICATION_UNAVAILABLE");
    assert.equal(store.rows[0].active, false);
  });
  it("açma zincir oluşturuyorsa engellenir", async () => {
    const store = new MemStore([rule("/a", "/b", false), rule("/b", "/product/blood-tank", true)]);
    const r = await toggleRedirect({ store, canonical: provider(), id: store.rows[0].id });
    assert.equal(!r.ok && r.code, "CHAIN_OUT");
  });
  it("olmayan kayıt", async () => {
    const r = await toggleRedirect({ store: new MemStore(), canonical: provider(), id: "yok" });
    assert.equal(!r.ok && r.code, "NOT_FOUND");
  });
});

describe("eşzamanlı kayıtlar (iki yönetici aynı anda)", () => {
  it("A→B ve B→C aynı anda: kilitle tam olarak biri kaydedilir, zincir oluşmaz", async () => {
    const store = new MemStore([], true, 5);
    const results = await Promise.all([save(store, input("/a", "/b")), save(store, input("/b", "/product/blood-tank"))]);
    assert.equal(results.filter((r) => r.ok).length, 1, JSON.stringify(results));
    assert.equal(store.rows.length, 1);
  });
  it("aynı kaynak aynı anda iki kez: yalnız biri kaydedilir", async () => {
    const store = new MemStore([], true, 5);
    const results = await Promise.all([save(store, input("/eski", "/products")), save(store, input("/eski", "/projects"))]);
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal(store.rows.length, 1);
    assert.ok(results.some((r) => !r.ok && r.code === "DUPLICATE_SOURCE"));
  });
  it("NEGATİF KONTROL: kilitsiz depoda aynı yarış zincir üretir (test, kilidin yokluğunu yakalar)", async () => {
    const store = new MemStore([], false, 5);
    const results = await Promise.all([save(store, input("/a", "/b")), save(store, input("/b", "/product/blood-tank"))]);
    assert.equal(results.filter((r) => r.ok).length, 2); // kilit yoksa ikisi de geçer → zincir
  });
  it("aynı pasif kaydı iki kişi aynı anda açar: idempotent, tek geçiş", async () => {
    const store = new MemStore([rule("/eski", "/products", false)], true, 5);
    const id = store.rows[0].id;
    const [x, y] = await Promise.all([toggleRedirect({ store, canonical: provider(), id }), toggleRedirect({ store, canonical: provider(), id })]);
    assert.ok(x.ok && y.ok);
    assert.equal(store.rows[0].active, true);
  });
  it("kayıt, ilk okuma ile açma arasında silinirse NOT_FOUND", async () => {
    const store = new MemStore([rule("/eski", "/products", false)]);
    const id = store.rows[0].id;
    const canonical = async () => { store.rows = []; return provider()(); }; // araya giren silme
    const r = await toggleRedirect({ store, canonical, id });
    assert.equal(!r.ok && r.code, "NOT_FOUND");
  });
});
