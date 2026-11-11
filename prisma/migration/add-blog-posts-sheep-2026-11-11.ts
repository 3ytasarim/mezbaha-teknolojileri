/**
 * 11.11.2026 — 3 bağımsız koyun konveyörü blog yazısı × 6 dil (EN ana dil, TR, DE, FR, RU, AR) = 18 sayfa.
 * Varsayılan DRY-RUN (hiçbir şey yazmaz); yazmak için --apply. Uzak (üretim) veritabanına yazmak ayrıca
 * ALLOW_PROD_WRITE=sheep-blogs-2026-11-11 ister; S3 yüklemesi yalnızca --apply ve --skip-s3 YOKSA yapılır.
 *   - Kaynak: blog-2026-11-11/source (articles/<dil>/*.md, metadata/posts.json, seo/) harici paketten aynen; görseller images/.
 *   - Görseller ORİJİNAL JPEG'dir: byte-byte yüklenir (yeniden kodlama/kırpma/sıkıştırma yok). SHA-256 hem paketteki
 *     original-images-checksum.json ile hem de yükleme sonrası S3'ten geri okunarak doğrulanır.
 *   - Her yazı = tek BlogPost (tek çeviri grubu). Kanonik slug Türkçe; EN slug = paketteki; diğer dillerde dile özgü slug
 *     (site kuralı; AR slug = EN slug). Canonical/hreflang kodla üretilir; `canonicalUrl` bilerek boş (sayfa onu PATH okur).
 *   - İdempotent upsert: yazı slug'ı varsa yeniden oluşturulmaz; eksik çeviriler eklenir, MEVCUT çeviriler ve yazılar ASLA ezilmez.
 *   - Markdown aynen aktarılır (yeniden çeviri/özet yok). Yalnız ticari kural uyumu için 6 küçük düzeltme (REPLACE), her biri tam bir kez eşleşir.
 *   - Yayın zamanı = uygulama anı (geriye tarihleme yok). Veritabanı bağlantısı DIRECT_URL (pooler değil).
 * Kullanım: npx tsx prisma/migration/add-blog-posts-sheep-2026-11-11.ts [--apply] [--skip-s3]
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { localizePath } from "../../src/lib/i18n/routes";
import { findClaims, findGatedTerms } from "../../src/lib/seo/commercial-claims";
import { scanText } from "../../src/lib/seo/commercial-claims-i18n";

type Loc = "tr" | "en" | "ru" | "de" | "fr" | "ar";
const LOCALES: Loc[] = ["tr", "en", "ru", "de", "fr", "ar"];
const APPLY = process.argv.includes("--apply");
const SKIP_S3 = process.argv.includes("--skip-s3");
const PROD_TOKEN = "sheep-blogs-2026-11-11";
const DIR = path.join(__dirname, "blog-2026-11-11");
const SRC = path.join(DIR, "source");

type PageMeta = { titleH1: string; metaTitle: string; metaDescription: string; excerpt: string; imageAlt: string; imageCaption: string; tags: string[]; markdownFile: string };
type PostMeta = { postId: string; slug: string; heroImage: string; pages: Record<Loc, PageMeta> };

/** Paketten gelen metinlerde ticari kural gereği (kurulum/devreye alma hizmeti ima etmeme) yapılan düzeltmeler. */
const REPLACE: Record<string, Partial<Record<Loc, [string, string][]>>> = {
  "01": {
    tr: [["kapasiteyi, sertifikayı veya tamamlanmış devreye alma işlemini kanıtlamaz", "kapasiteyi veya sertifikayı kanıtlamaz"]],
    ru: [["производительность, сертификацию или завершённый ввод в эксплуатацию", "производительность или сертификацию"]],
    de: [["weder Förderleistung noch Zulassung oder abgeschlossene Inbetriebnahme ableiten", "weder Förderleistung noch Zulassung ableiten"]],
    fr: [["une capacité, une certification ou une mise en service achevée", "une capacité ou une certification"]],
    ar: [["الطاقة الإنتاجية أو الاعتماد التنظيمي أو اكتمال التشغيل التجريبي", "الطاقة الإنتاجية أو الاعتماد التنظيمي"]],
  },
  "03": { en: [["electrical connections and commissioning services are included", "electrical connections and supporting documentation are included"]] },
};
/** Elle incelenmiş REVIEW/DEFINITE eşleşmeleri: olumsuzlama ("kanıtlamaz"), alıcı tavsiyesi veya yasal atıf bağlamında; iddia değil. */
const ACCEPTED: Record<string, Partial<Record<Loc, string[]>>> = {
  "01": {
    tr: ["INSTALL_WORD:kurulum", "INSTALL_WORD:kurulan", "CERTIFICATION:sertifika", "CERTIFICATION:USDA"],
    en: ["INSTALL_WORD:installation", "CERTIFICATION:USDA", "CERTIFICATION:HACCP", "PLANT_DESIGN:Plant Design"],
    ru: ["INSTALL_WORD:монтаж", "CERTIFICATION:сертиф", "CERTIFICATION:USDA", "CERTIFICATION:одобрен"],
    de: ["INSTALL_WORD:Installation", "CERTIFICATION:USDA", "PLANT_DESIGN:Anlagenplanung"],
    fr: ["INSTALL_WORD:installation", "CERTIFICATION:certifi", "CERTIFICATION:USDA"],
    ar: ["INSTALL_WORD:تركيب", "CERTIFICATION:اعتماد", "CERTIFICATION:USDA", "CERTIFICATION:معتمد"],
  },
  "02": {
    tr: ["CERTIFICATION:sertifika", "INSTALL_WORD:kurulum", "CERTIFICATION:HACCP", "CONSTRUCTION:inşaat"],
    en: ["INSTALL_WORD:installation", "INSTALL_WORD:installed", "CERTIFICATION:USDA", "MANUFACTURER_CLAIM:manufacturer"],
    ru: ["CERTIFICATION:сертиф"],
    de: ["CERTIFICATION:Zertifi", "INSTALL_WORD:Installation", "CERTIFICATION:Konform"],
    fr: ["INSTALL_WORD:installation"],
    ar: ["INSTALL_WORD:تركيب", "CERTIFICATION:شهادة"],
  },
  "03": {
    tr: ["CERTIFICATION:HACCP"],
    en: ["CERTIFICATION:certif", "PLANT_DESIGN:plant design", "CERTIFICATION:HACCP", "MANUFACTURER_CLAIM:manufacturer"],
    ru: ["CERTIFICATION:HACCP", "CERTIFICATION:соответству", "INSTALL_WORD:монтаж"],
    de: ["CERTIFICATION:HACCP"],
    fr: ["INSTALL_WORD:installation", "CERTIFICATION:HACCP"],
    ar: ["CERTIFICATION:HACCP"],
  },
};
/** Dile özgü slug'lar (TR = kanonik/taban). EN = paketin slug'ı; AR = EN. */
const SLUGS: Record<string, Record<Loc, string | null>> = {
  "01": { tr: null, en: "sheep-slaughter-conveyor-planning", ru: "konveyer-dlya-uboya-ovec-planirovka-linii", de: "schaf-schlachtfoerderanlagen-lammverarbeitung-planung", fr: "convoyeurs-abattage-ovin-ligne-agneaux", ar: "sheep-slaughter-conveyor-planning" },
  "02": { tr: null, en: "overhead-sheep-conveyor", ru: "podvesnoy-konveyer-dlya-ovec-cepi-relsy-tushi", de: "haengefoerderer-schafe-ketten-schienen", fr: "convoyeurs-aeriens-ovins-chaines-rails", ar: "overhead-sheep-conveyor" },
  "03": { tr: null, en: "sheep-processing-belt-conveyor", ru: "lentochnye-konveyery-pererabotka-ovec-gigiena", de: "foerderbaender-schafverarbeitung-hygiene-integration", fr: "bandes-transporteuses-ovins-hygiene-integration", ar: "sheep-processing-belt-conveyor" },
};
const TR_BASE_SLUG: Record<string, string> = { "01": "koyun-kesim-konveyor-sistemi-kuzu-isleme-hatti-planlama", "02": "ustten-koyun-konveyor-zincir-ray-karkas-aktarim", "03": "koyun-isleme-banti-konveyor-hijyen-hat-entegrasyonu" };
const DROP_TAGS = new Set(["Kesimhane Tasarımı"]); // tesis tasarımı hizmeti ima eder (ticari kural)
const PRODUCT_SLUG = "koyun-isleme-konveyoru"; // EN: sheep-processing-conveyor
const PRODUCT_LINK_POSTS = new Set(["01", "02"]); // 03'te ürün metinde bağlanır ama "aynı cihaz" izlenimi vermemek için ilgili ürün listesine eklenmez

const UI: Record<Loc, { related: string; category: string; cta: string }> = {
  tr: { related: "İlgili sayfalar", category: "Ürün grubu", cta: "Teklif talep edin" },
  en: { related: "Related pages", category: "Product group", cta: "Request a quote" },
  ru: { related: "Связанные страницы", category: "Группа изделий", cta: "Запросить предложение" },
  de: { related: "Weiterführende Seiten", category: "Produktgruppe", cta: "Angebot anfordern" },
  fr: { related: "Pages associées", category: "Gamme", cta: "Demander un devis" },
  ar: { related: "صفحات ذات صلة", category: "مجموعة المنتجات", cta: "اطلب عرض سعر" },
};

const TR_MAP: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
const slugify = (s: string) => s.split("").map((c) => TR_MAP[c] ?? c).join("").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const balanced = (h: string, tag: string) => (h.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length === (h.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
const sha256 = (b: Buffer) => crypto.createHash("sha256").update(b).digest("hex");
const getS3 = () => new S3Client({ endpoint: process.env.STORAGE_ENDPOINT, region: process.env.STORAGE_REGION || "us-east-1", credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY!, secretAccessKey: process.env.STORAGE_SECRET_KEY! }, forcePathStyle: true });

type Resolver = (loc: Loc, href: string) => string;
const inline = (s: string, loc: Loc, resolve: Resolver) =>
  esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t: string, u: string) => { const r = resolve(loc, u); return /^https?:/.test(r) ? `<a href="${r}" target="_blank" rel="noopener noreferrer">${t}</a>` : `<a href="${r}">${t}</a>`; })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");

function mdToHtml(md: string, loc: Loc, postId: string, resolve: Resolver): string {
  let body = md;
  for (const [from, to] of REPLACE[postId]?.[loc] ?? []) {
    const n = body.split(from).length - 1;
    if (n !== 1) throw new Error(`${postId}/${loc}: düzeltme ${n} kez eşleşti (1 olmalı): ${from}`);
    body = body.replace(from, to);
  }
  const out: string[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith("# ")) continue; // H1'i sayfa şablonu basar
    if (/^!\[/.test(l)) throw new Error(`${postId}/${loc}: md içinde görsel var (beklenmiyordu)`);
    if (l.startsWith("## ")) out.push(`<h2>${inline(l.slice(3).trim(), loc, resolve)}</h2>`);
    else if (l.startsWith("### ")) out.push(`<h3>${inline(l.slice(4).trim(), loc, resolve)}</h3>`);
    else out.push(`<p>${inline(l, loc, resolve)}</p>`);
  }
  return out.join("\n");
}

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL tanımlı değil");
  const host = new URL(url).hostname;
  if (/-pooler\./.test(host)) throw new Error("DIRECT_URL pooler görünüyor");
  const isLocal = /^(localhost|127\.0\.0\.1|\[?::1\]?)$/.test(host);
  console.log(`Hedef veritabanı: ${isLocal ? "YEREL (test)" : "UZAK (üretim olabilir)"} | S3: ${APPLY && !SKIP_S3 ? "yazılacak" : "yazılmayacak"} | mod: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  if (APPLY && !isLocal && process.env.ALLOW_PROD_WRITE !== PROD_TOKEN) throw new Error(`Uzak veritabanına yazmak için onay gerekir: ALLOW_PROD_WRITE=${PROD_TOKEN}`);

  const meta = JSON.parse(fs.readFileSync(path.join(SRC, "metadata/posts.json"), "utf8")) as { posts: PostMeta[] };
  const sums = JSON.parse(fs.readFileSync(path.join(SRC, "metadata/original-images-checksum.json"), "utf8")) as { postId: string; packagedFile: string; sha256Packaged: string; sha256Original: string; width: number; height: number }[];

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const category = await prisma.blogCategory.findUnique({ where: { slug: "mezbaha-sistemleri" } });
    if (!category) throw new Error("mezbaha-sistemleri kategorisi yok");
    const product = await prisma.product.findUnique({ where: { slug: PRODUCT_SLUG }, include: { translations: true } });
    if (!product) throw new Error(`ürün yok: ${PRODUCT_SLUG}`);
    const pcat = await prisma.productCategory.findUnique({ where: { slug: "kucukbas" }, include: { translations: true } });
    if (!pcat) throw new Error("kucukbas ürün kategorisi yok");

    let problems = 0;
    const warn = (m: string) => { problems++; console.log("  UYARI:", m); };

    // md'deki bağlantılar: site içi ürün adresi → dile göre yerelleşmiş yol; dış (law.cornell.edu) olduğu gibi
    const resolve: Resolver = (loc, href) => {
      const m = href.match(/^https:\/\/www\.mezbahateknolojileri\.com\/product\/(.+)$/);
      if (m) {
        if (m[1] !== "sheep-processing-conveyor") throw new Error(`beklenmeyen ürün bağlantısı ${href}`);
        const t = product.translations.find((x) => x.locale === loc);
        if (!t) throw new Error(`${loc}: ürün çevirisi yok`);
        return localizePath(loc, `/urun/${t.slug ?? product.slug}`);
      }
      if (/^https:\/\/www\.law\.cornell\.edu\/cfr\/text\/9\//.test(href)) return href;
      throw new Error(`çözülemeyen bağlantı ${href}`);
    };
    const enProd = product.translations.find((x) => x.locale === "en");
    if (enProd?.slug !== "sheep-processing-conveyor") warn(`EN ürün slug'ı beklenenden farklı: ${enProd?.slug}`);

    // Görsel doğrulama: SHA-256 ↔ paket checksum dosyası
    const images: Record<string, { data: Buffer; key: string; urlPath: string; sha: string; w: number; h: number }> = {};
    for (const pm of meta.posts) {
      const sum = sums.find((s) => s.postId === pm.postId)!;
      const file = path.join(DIR, "images", path.basename(pm.heroImage));
      const data = fs.readFileSync(file);
      const sha = sha256(data), m = await sharp(data).metadata();
      const ok = sha === sum.sha256Packaged && sha === sum.sha256Original && path.basename(sum.packagedFile) === path.basename(file);
      console.log(`  görsel ${pm.postId}: ${path.basename(file)} ${m.width}x${m.height} ${m.format} ${(data.length / 1024).toFixed(0)} KB sha256=${sha.slice(0, 16)}… checksum ${ok ? "EŞLEŞTİ" : "UYUŞMUYOR"}`);
      if (!ok) warn(`görsel ${pm.postId}: SHA-256 checksum dosyasıyla eşleşmiyor`);
      if (m.width !== 1280 || m.height !== 1280 || m.format !== "jpeg") warn(`görsel ${pm.postId}: 1280x1280 jpeg değil`);
      const base = path.basename(file).replace(/\.jpeg$/, "");
      const key = `${base}-${sha.slice(0, 8)}.jpeg`;
      images[pm.postId] = { data, key, urlPath: `/uploads/${key}`, sha, w: m.width ?? 1280, h: m.height ?? 1280 };
    }

    type Row = { pm: PostMeta; exists: boolean; missingLocales: Loc[]; contents: Record<Loc, string>; tags: string[] };
    const plan: Row[] = [];
    for (const pm of meta.posts) {
      const post = pm.postId;
      const trBase = TR_BASE_SLUG[post];
      const existing = await prisma.blogPost.findUnique({ where: { slug: trBase }, include: { translations: true } });
      console.log(`\n=== Yazı ${post}: ${trBase} ${existing ? `(ZATEN VAR — ${existing.translations.length} çeviri; mevcut içerik ezilmez)` : ""}`);
      const contents = {} as Record<Loc, string>;
      const sibs = meta.posts.filter((x) => x.postId !== post);
      for (const loc of LOCALES) {
        const pg = pm.pages[loc];
        const md = fs.readFileSync(path.join(SRC, pg.markdownFile), "utf8");
        const bodyOnly = mdToHtml(md, loc, post, resolve);
        const slug = SLUGS[post][loc];
        const lp = (p: string) => localizePath(loc, p);
        const items: string[] = [];
        for (const sb of sibs) items.push(`<li><a href="${lp(`/blog/${SLUGS[sb.postId][loc] ?? TR_BASE_SLUG[sb.postId]}`)}">${esc(sb.pages[loc].titleH1)}</a></li>`);
        const ct = pcat.translations.find((x) => x.locale === loc);
        if (!ct) warn(`${post}/${loc}: kategori çevirisi yok`); else items.push(`<li><a href="${lp(`/urunler/${ct.slug ?? pcat.slug}`)}">${UI[loc].category}: ${esc(ct.name)}</a></li>`);
        contents[loc] = `${bodyOnly}\n<h2>${UI[loc].related}</h2>\n<ul>\n${items.join("\n")}\n</ul>\n<p><a href="${lp("/teklif-al")}">${UI[loc].cta}</a></p>`;

        const words = bodyOnly.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
        console.log(`  ${loc}: h1(${pg.titleH1.length}) seoTitle(${pg.metaTitle.length}) seoDesc(${pg.metaDescription.length}) excerpt(${pg.excerpt.length}) alt(${pg.imageAlt.length}) kelime(${words}) slug=${slug ?? "(kanonik)"}`);
        if (pg.metaTitle.length > 60) warn(`${post}/${loc}: seoTitle ${pg.metaTitle.length} > 60`);
        if (pg.metaDescription.length > 170 || pg.metaDescription.length < 100) warn(`${post}/${loc}: metaDescription ${pg.metaDescription.length} aralık dışı`);
        if (!pg.excerpt || !pg.imageAlt || pg.imageAlt.length > 200) warn(`${post}/${loc}: excerpt/alt eksik veya uzun`);
        for (const tag of ["p", "h2", "h3", "ul", "li", "strong", "em", "a"]) if (!balanced(contents[loc], tag)) warn(`${post}/${loc}: <${tag}> dengesiz`);
        if (/<h1|<img/i.test(contents[loc])) warn(`${post}/${loc}: gövdede H1/img var`);
        if (/\]\(|\*\*/.test(bodyOnly.replace(/<[^>]+>/g, " "))) warn(`${post}/${loc}: işlenmemiş markdown kalıntısı`);
        const h2s = (md.match(/^## /gm) ?? []).length;
        if ((bodyOnly.match(/<h2>/g) ?? []).length !== h2s) warn(`${post}/${loc}: H2 sayısı md ile uyuşmuyor`);

        // Ticari iddia korumaları: kabul listesi dışındaki her eşleşme engeller (liste elle incelendi: olumsuzlama/alıcı tavsiyesi/yasal atıf).
        const acc = ACCEPTED[post]?.[loc] ?? [];
        const all = [pg.titleH1, pg.excerpt, pg.metaTitle, pg.metaDescription, pg.imageAlt, pg.imageCaption, bodyOnly].join("\n");
        for (const h of scanText(all, loc)) if (!acc.includes(`${h.rule}:${h.match}`)) warn(`${post}/${loc}: ticari iddia ${h.severity}:${h.rule}«${h.match}»`);
        if (loc === "en") {
          const c = findClaims(all).filter((h) => !acc.includes(`${h.rule}:${h.match}`)), g = findGatedTerms(all).filter((h) => !acc.includes(`${h.id}:${h.match}`));
          if (c.length || g.length) warn(`${post}/en: ${[...c.map((h) => h.rule + "«" + h.match + "»"), ...g.map((h) => h.id + "«" + h.match + "»")].join(", ")}`);
          if (/\b(turnkey|guarantee\w*|leader|best|commission\w*|NSF|FDA)\b/i.test(all) || /USDA[- ]approved(?!”| unless)/i.test(all.replace(/“USDA approved”/g, ""))) warn(`${post}/en: yasak/riskli sözcük`);
        }
        if (/anahtar teslim|turnkey|под ключ|schlüsselfertig|clé en main|تسليم المفتاح/i.test(all)) warn(`${post}/${loc}: anahtar teslim ifadesi`);
        if (loc !== "tr" && slug) {
          const clash = await prisma.blogPostTranslation.findFirst({ where: { locale: loc, slug } });
          if (clash && !existing) warn(`${post}/${loc}: slug zaten kullanılıyor: ${slug}`);
          if (clash && existing && clash.blogPostId !== existing.id) warn(`${post}/${loc}: slug başka yazıda: ${slug}`);
        }
      }
      const tags = pm.pages.tr.tags.filter((t) => !DROP_TAGS.has(t));
      console.log(`  etiketler (${tags.length}): ${tags.join(", ")}`);
      const missingLocales = existing ? LOCALES.filter((l) => !existing.translations.some((t) => t.locale === l)) : LOCALES;
      if (existing) console.log(`  eksik çeviriler: ${missingLocales.join(",") || "yok"}`);
      plan.push({ pm, exists: !!existing, missingLocales, contents, tags });
    }

    // Aynı dilde üç yazının slug'ı birbirinden farklı olmalı
    for (const loc of LOCALES) { const s = ["01", "02", "03"].map((p) => SLUGS[p][loc] ?? TR_BASE_SLUG[p]); if (new Set(s).size !== 3) warn(`${loc}: yazı slug'ları çakışıyor`); }
    const media = await prisma.media.findMany({ where: { storageKey: { in: Object.values(images).map((i) => i.key) } }, select: { storageKey: true } });
    console.log(`\nMedya kayıtları (zaten var): ${media.length}/3`);

    if (problems) console.log(`\n${problems} uyarı var.`);
    if (!APPLY) { console.log("\nKuru çalıştırma (DB/S3'e yazılmadı). Uygulamak için: --apply"); process.exitCode = problems ? 1 : 0; return; }
    if (problems) throw new Error("Uyarılar giderilmeden uygulanmaz.");

    if (!SKIP_S3) {
      const s3 = getS3();
      for (const im of Object.values(images)) {
        await s3.send(new PutObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: `uploads/${im.key}`, Body: im.data, ContentType: "image/jpeg", CacheControl: "public, max-age=31536000, immutable" }));
        const back = Buffer.from(await (await s3.send(new GetObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: `uploads/${im.key}` }))).Body!.transformToByteArray());
        console.log(`S3: uploads/${im.key} ${back.length === im.data.length && sha256(back) === im.sha ? "yüklendi, geri okuma SHA-256 EŞLEŞTİ" : "GERİ OKUMA UYUŞMUYOR"}`);
        if (sha256(back) !== im.sha) throw new Error(`S3 geri okuma uyuşmuyor: ${im.key}`);
      }
    }

    for (const { pm, exists, missingLocales, contents, tags } of plan) {
      const im = images[pm.postId];
      const tr = pm.pages.tr;
      await prisma.$transaction(async (tx) => {
        if (!(await tx.media.findUnique({ where: { storageKey: im.key } }))) {
          await tx.media.create({ data: { filename: im.key, originalName: path.basename(pm.heroImage), mimeType: "image/jpeg", url: im.urlPath, storageKey: im.key, alt: tr.imageAlt, caption: tr.imageCaption, width: im.w, height: im.h, fileSize: im.data.length } });
        }
        const tagIds: string[] = [];
        for (const name of tags) { const slug = slugify(name); const t = (await tx.blogTag.findUnique({ where: { slug } })) ?? (await tx.blogTag.create({ data: { slug, name } })); tagIds.push(t.id); }
        const tdata = (loc: Loc) => { const pg = pm.pages[loc]; return { locale: loc, slug: SLUGS[pm.postId][loc], title: pg.titleH1, excerpt: pg.excerpt, content: contents[loc], seoTitle: pg.metaTitle, seoDescription: pg.metaDescription, imageAlt: pg.imageAlt }; };
        if (!exists) {
          const now = new Date();
          const prod = PRODUCT_LINK_POSTS.has(pm.postId) ? [{ id: (await tx.product.findUniqueOrThrow({ where: { slug: PRODUCT_SLUG } })).id }] : [];
          await tx.blogPost.create({
            data: {
              slug: TR_BASE_SLUG[pm.postId], categoryId: category.id, coverImage: im.urlPath, coverImageAlt: tr.imageAlt, authorType: "company", status: "PUBLISHED", featured: false,
              publishedAt: now, createdAt: now, tags: { connect: tagIds.map((id) => ({ id })) }, relatedProducts: { connect: prod },
              translations: { create: LOCALES.map(tdata) },
            },
          });
          console.log(`DB: oluşturuldu ${TR_BASE_SLUG[pm.postId]} (6 dil, ${tags.length} etiket)`);
        } else if (missingLocales.length) {
          const post = await tx.blogPost.findUniqueOrThrow({ where: { slug: TR_BASE_SLUG[pm.postId] } });
          for (const loc of missingLocales) await tx.blogPostTranslation.create({ data: { blogPostId: post.id, ...tdata(loc) } });
          console.log(`DB: ${TR_BASE_SLUG[pm.postId]} için eksik çeviriler eklendi: ${missingLocales.join(",")}`);
        } else console.log(`DB: ${TR_BASE_SLUG[pm.postId]} zaten tam; dokunulmadı`);
      }, { maxWait: 10000, timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1200)); // üç yazının yayın zamanı birbirinden ayrışsın (gerçek, sıralı zaman damgaları)
    }

    const check = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    try {
      for (const pm of meta.posts) {
        const p = await check.blogPost.findUnique({ where: { slug: TR_BASE_SLUG[pm.postId] }, include: { translations: true, tags: true, relatedProducts: true } });
        console.log(`doğrulama ${TR_BASE_SLUG[pm.postId]}: ${p?.status}, yayın ${p?.publishedAt?.toISOString()}, çeviri ${p?.translations.length}, etiket ${p?.tags.length}, ürün ${p?.relatedProducts.length}, kapak ${p?.coverImage}`);
      }
      console.log(`toplam yazı: ${await check.blogPost.count()}`);
    } finally { await check.$disconnect(); }
  } finally { await prisma.$disconnect(); }
}

main().catch((e) => { console.error(String(e instanceof Error ? e.message : e).replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, "[redacted-url]").slice(0, 700)); process.exitCode = 1; });
