// Geçici çalışma dosyasını (TEMP/ruwork/ru-X.cjs) depoya JSON olarak yazar: node prisma/migration/store-ru-batch.cjs <harf>
const fs = require("fs");
const en = require(process.env.TEMP + "/ruwork/en.json");
const b = require(process.env.TEMP + "/ruwork/ru-" + process.argv[2] + ".cjs");
const out = b.map((x) => ({ enSlug: en[x.i].enSlug, title: x.title, excerpt: x.excerpt, seoTitle: x.seoTitle, seoDescription: x.seoDescription, content: x.content, ...(x.enContent ? { enContent: x.enContent } : {}) }));
fs.writeFileSync(__dirname + "/data/ru-blog/" + process.argv[2] + ".json", JSON.stringify(out, null, 1));
console.log(out.map((o) => o.enSlug).join("\n"));
