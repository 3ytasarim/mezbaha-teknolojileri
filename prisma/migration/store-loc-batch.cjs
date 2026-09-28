/**
 * Elle çevrilen parti dosyasını (%TEMP%/loc/work/<tür>-<parti>.cjs → [{ i, de:{…}, fr:{…}, ar:{…} }]) dile göre JSON'a böler:
 * prisma/migration/data/loc/<dil>/<tür>-<parti>.json. `i` = %TEMP%/loc/<tür>.json (İngilizce döküm) içindeki sıra.
 * Eksik seoTitle → ad/başlık; eksik seoDescription → shortDescription/excerpt. Kullanım: node store-loc-batch.cjs <tür> <parti>
 */
const fs = require("fs");
const path = require("path");
const [kind, batch] = process.argv.slice(2);
const en = JSON.parse(fs.readFileSync(path.join(process.env.TEMP, "loc", kind + ".json"), "utf8"));
const items = require(path.join(process.env.TEMP, "loc", "work", `${kind}-${batch}.cjs`));
// Parti dosyası yalnızca üretilecek dil(ler)in anahtarını içerir (ör. yalnızca `fr`); zaten aktarılmış diller yeniden işlenmez.
const langs = Object.keys(items[0] ?? {}).filter((k) => k !== "i");
for (const l of langs) {
  const out = items.map((it) => {
    const t = it[l];
    if (!t) throw new Error(`${l} yok: i=${it.i}`);
    const r = { enSlug: en[it.i].slug, ...t };
    if (!r.seoTitle) r.seoTitle = r.name ?? r.title;
    if (!r.seoDescription) r.seoDescription = (r.shortDescription ?? r.excerpt ?? "").replace(/<[^>]+>/g, "");
    if (!r.description && kind !== "blog") r.description = r.shortDescription;
    return r;
  });
  const dir = path.join(__dirname, "data", "loc", l);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${kind}-${batch}.json`), JSON.stringify(out, null, 1));
}
console.log(kind, batch, items.length, "kayıt");
