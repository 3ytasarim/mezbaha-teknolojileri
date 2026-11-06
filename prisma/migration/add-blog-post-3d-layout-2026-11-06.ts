/**
 * 06.11.2026 — "Beef slaughter line layout (3D)" blog yazısı × 6 dil. Varsayılan DRY-RUN; yazmak için --apply.
 *   - Kaynak: blog-2026-11-06/source (articles/*.md + seo/*.json, harici paketten aynen). Üç 3D konsept görsel: blog-2026-11-06/images.
 *   - Tek BlogPost (tek çeviri grubu): kanonik slug Türkçe, diğer dillerde dile özgü slug (site kuralı; EN = paketin önerdiği slug, AR slug = EN).
 *     Canonical/hreflang kodla üretilir (kendine canonical); `canonicalUrl` bilerek boş (sayfa onu PATH olarak okur).
 *   - Görsel 1 = kapak (sayfa şablonu üstte gösterir, og:image); görsel 2-3 gövdede <figure> (alt + figcaption + width/height).
 *   - Paketten yalnızca TİCARİ KURAL uyumu için üç küçük metin düzeltmesi (EN/RU) ve başlık/excerpt'te "design/проект" sözcükleri
 *     (firma tesis tasarımı vermez) değiştirilir; her düzeltme tam bir kez eşleşmek zorundadır.
 *   - Yayın tarihi = uygulama anı (geriye tarihleme yok). Veritabanı bağlantısı DIRECT_URL (pooler değil).
 * Yeniden çalıştırılabilir: slug varsa atlanır. Kullanım: npx tsx prisma/migration/add-blog-post-3d-layout-2026-11-06.ts [--apply]
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { localizePath } from "../../src/lib/i18n/routes";
import { findClaims, findGatedTerms } from "../../src/lib/seo/commercial-claims";
import { scanText } from "../../src/lib/seo/commercial-claims-i18n";

type Loc = "tr" | "en" | "ru" | "de" | "fr" | "ar";
const LOCALES: Loc[] = ["tr", "en", "ru", "de", "fr", "ar"];
const APPLY = process.argv.includes("--apply");
const DIR = path.join(__dirname, "blog-2026-11-06");
const POST_SLUG = "buyukbas-kesim-hatti-yerlesimi-3d-ekipman-planlama";

type Seo = { title: string; meta: string; excerpt: string; alts: string[]; captions: string[] };
type Cfg = {
  slug: string | null; // TR = null (kanonik)
  h1: string;
  seoTitle: string; // site " | Mezbaha Teknolojileri" ekler → kısa tutulur
  excerpt?: string; // verilmezse paketteki
  faqHeading: string;
  replace: [string, string][]; // md gövdesinde TAM BİR KEZ eşleşmesi gereken düzeltmeler
  accepted: string[]; // elle incelenmiş, ret/olumsuzlama bağlamındaki REVIEW eşleşmeleri ("RULE:eşleşme")
  ui: { related: string; product: string; category: string; cta: string };
};

const CFG: Record<Loc, Cfg> = {
  tr: {
    slug: null, h1: "Büyükbaş Kesim Hattı Yerleşimi: 3D Görünüm ve Ekipman Planlama", seoTitle: "Büyükbaş Kesim Hattı Yerleşimi: 3D Planlama",
    faqHeading: "Sık Sorulan Sorular", replace: [],
    accepted: ["INSTALL_WORD:kurulmuş", "PLANT_DESIGN:tesis proje"],
    ui: { related: "İlgili sayfalar", product: "Ürün sayfası", category: "Ürün grubu", cta: "Teklif talep edin" },
  },
  en: {
    slug: "beef-slaughter-line-layout-3d-equipment-planning", h1: "Beef Slaughter Line Layout: 3D View & Equipment Planning", seoTitle: "Beef Slaughter Line Layout in 3D",
    excerpt: "A practical 3D walkthrough of a beef slaughter line layout, showing how overhead rails, carcass transfer stations and operator platforms fit into an efficient facility layout.",
    faqHeading: "Frequently Asked Questions",
    replace: [
      ["not photographs of a commissioned installation", "not photographs of an operating facility"],
      ["have the proposed U.S. installation reviewed", "have the proposed U.S. project reviewed"],
      ["photographs of an installed slaughterhouse", "photographs of an existing slaughterhouse"],
    ],
    accepted: ["CERTIFICATION:USDA"],
    ui: { related: "Related pages", product: "Product page", category: "Product group", cta: "Request a quote" },
  },
  ru: {
    slug: "planirovka-linii-uboya-krs-3d-oborudovanie", h1: "Планировка линии убоя КРС: 3D-обзор и оборудование", seoTitle: "Планировка линии убоя КРС в 3D",
    faqHeading: "Частые вопросы",
    replace: [["фотографиями введённого в эксплуатацию объекта", "фотографиями действующего объекта"]],
    accepted: ["INSTALL_WORD:установлен"],
    ui: { related: "Связанные страницы", product: "Страница изделия", category: "Группа изделий", cta: "Запросить предложение" },
  },
  de: {
    slug: "rinderschlachtlinie-3d-layout-ausruestung", h1: "Rinderschlachtlinie planen: 3D-Layout und Ausrüstung", seoTitle: "Rinderschlachtlinie planen: 3D-Layout",
    faqHeading: "Häufige Fragen", replace: [],
    accepted: ["INSTALL_WORD:installiert"],
    ui: { related: "Weiterführende Seiten", product: "Produktseite", category: "Produktgruppe", cta: "Angebot anfordern" },
  },
  fr: {
    slug: "implantation-ligne-abattage-bovin-3d-equipements", h1: "Implantation de ligne d’abattage bovin : vue 3D et équipements", seoTitle: "Ligne d’abattage bovin : implantation 3D",
    faqHeading: "Questions fréquentes", replace: [],
    accepted: ["INSTALL_WORD:installation"],
    ui: { related: "Pages associées", product: "Fiche produit", category: "Gamme", cta: "Demander un devis" },
  },
  ar: {
    slug: "beef-slaughter-line-layout-3d-equipment-planning", h1: "تخطيط خط ذبح الأبقار: عرض ثلاثي الأبعاد واختيار المعدات", seoTitle: "تخطيط خط ذبح الأبقار ثلاثي الأبعاد",
    faqHeading: "الأسئلة الشائعة", replace: [],
    accepted: ["CERTIFICATION:اعتماد", "CERTIFICATION:معتمد"],
    ui: { related: "صفحات ذات صلة", product: "صفحة المنتج", category: "مجموعة المنتجات", cta: "اطلب عرض سعر" },
  },
};

const IMAGES = [
  { file: "beef-slaughter-line-layout-overhead-rail-3d.webp", seoName: "beef-slaughter-line-layout-overhead-rail-3d" },
  { file: "cattle-slaughterhouse-equipment-workstations-3d.webp", seoName: "cattle-slaughterhouse-equipment-workstations-3d" },
  { file: "meat-processing-plant-layout-carcass-conveyor-3d.webp", seoName: "meat-processing-plant-layout-carcass-conveyor-3d" },
];
// BlogTag tek dillidir (Türkçe) ve yalnız TR sayfalarında görünür
const TAGS = ["Büyükbaş Kesim Hattı", "Mezbaha Yerleşim Planı", "Karkas Taşıma Sistemi", "İkiz Ray Sistemi", "Büyükbaş Mezbaha Ekipmanları", "3D Mezbaha Yerleşimi"];
const PRODUCT_SLUGS = ["sigir-isleme-hatti", "monray-ikizray"];
const RELATED_BLOGS = ["3d-mezbaha-projelendirmesi-tesis-yerlesimi", "buyukbas-kesim-hatti-konveyor-ray-sistemleri", "karkas-isleme-istasyonlari-hijyen-ergonomi"];

const TR_MAP: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
const slugify = (s: string) => s.split("").map((c) => TR_MAP[c] ?? c).join("").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const balanced = (h: string, tag: string) => (h.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length === (h.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
const getS3 = () => new S3Client({ endpoint: process.env.STORAGE_ENDPOINT, region: process.env.STORAGE_REGION || "us-east-1", credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY!, secretAccessKey: process.env.STORAGE_SECRET_KEY! }, forcePathStyle: true });

/** md → gövde HTML. Görsel 1 (kapak) atlanır; 2-3 <figure>; H1/blockquote/byline atlanır. */
function mdToHtml(md: string, loc: Loc, seo: Seo, imgUrls: string[]): string {
  let body = md;
  for (const [from, to] of CFG[loc].replace) {
    const n = body.split(from).length - 1;
    if (n !== 1) throw new Error(`${loc}: düzeltme ${n} kez eşleşti (1 olmalı): ${from}`);
    body = body.replace(from, to);
  }
  const out: string[] = [];
  const lines = body.split(/\r?\n/);
  let imgIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith("# ") || l.startsWith(">") || l.startsWith("**")) continue;
    const im = l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (im) {
      imgIdx++;
      const cap = (lines[i + 2] ?? "").trim().match(/^\*([^*]+)\*$/)?.[1];
      if (!cap) throw new Error(`${loc}: görsel ${imgIdx + 1} için alt satırda figcaption yok`);
      if (esc(im[1]) !== esc(seo.alts[imgIdx])) throw new Error(`${loc}: md alt ≠ seo alt (görsel ${imgIdx + 1})`);
      if (imgIdx > 0) out.push(`<figure><img src="${imgUrls[imgIdx]}" alt="${esc(im[1])}" width="1600" height="900" loading="lazy" decoding="async" /><figcaption>${esc(cap)}</figcaption></figure>`);
      i += 2;
      continue;
    }
    if (l.startsWith("## ")) { const t = l.slice(3).trim(); out.push(`<h2>${esc(t === "FAQ" ? CFG[loc].faqHeading : t)}</h2>`); continue; }
    if (l.startsWith("### ")) { out.push(`<h3>${esc(l.slice(4).trim())}</h3>`); continue; }
    out.push(`<p>${esc(l)}</p>`);
  }
  if (imgIdx !== 2) throw new Error(`${loc}: 3 görsel bekleniyordu, ${imgIdx + 1} bulundu`);
  return out.join("\n");
}

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL tanımlı değil");
  if (/-pooler\./.test(new URL(url).hostname)) throw new Error("DIRECT_URL pooler görünüyor");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const category = await prisma.blogCategory.findUnique({ where: { slug: "mezbaha-sistemleri" } });
    if (!category) throw new Error("mezbaha-sistemleri kategorisi yok");
    const exists = !!(await prisma.blogPost.findUnique({ where: { slug: POST_SLUG } }));
    let problems = 0;
    const warn = (m: string) => { problems++; console.log("  UYARI:", m); };
    console.log(`=== ${POST_SLUG} ${exists ? "(ZATEN VAR — atlanacak)" : ""}`);

    // Görseller: S3 anahtarları hash'ten önceden hesaplanır (gövde HTML'i URL'leri içerir)
    const imgs = IMAGES.map((im) => {
      const file = path.join(DIR, "images", im.file);
      const data = fs.readFileSync(file);
      const key = `${im.seoName}-${crypto.createHash("sha1").update(data).digest("hex").slice(0, 8)}.webp`;
      return { ...im, file, data, key, urlPath: `/uploads/${key}` };
    });
    for (const im of imgs) {
      const m = await sharp(im.file).metadata();
      console.log(`  görsel: ${im.file.split(/[\\/]/).pop()} ${m.width}x${m.height} ${m.format} ${(im.data.length / 1024).toFixed(0)} KB → ${im.urlPath}`);
      if (m.width !== 1600 || m.height !== 900 || m.format !== "webp") warn(`${im.seoName}: 1600x900 webp değil`);
    }

    const product = await Promise.all(PRODUCT_SLUGS.map((s) => prisma.product.findUnique({ where: { slug: s }, include: { translations: true } })));
    if (product.some((p) => !p)) throw new Error("ürün bulunamadı");
    const cat = await prisma.productCategory.findUnique({ where: { slug: "buyukbas" }, include: { translations: true } });
    if (!cat) throw new Error("buyukbas ürün kategorisi yok");
    const blogs = await Promise.all(RELATED_BLOGS.map((s) => prisma.blogPost.findUnique({ where: { slug: s }, include: { translations: true } })));
    if (blogs.some((b) => !b)) throw new Error("ilgili blog bulunamadı");

    const contents = {} as Record<Loc, string>;
    const seos = {} as Record<Loc, Seo>;
    for (const loc of LOCALES) {
      const cfg = CFG[loc];
      const seo = JSON.parse(fs.readFileSync(path.join(DIR, "source/seo", `${loc}.json`), "utf8")) as Seo;
      seos[loc] = seo;
      const md = fs.readFileSync(path.join(DIR, "source/articles", `${loc}.md`), "utf8");
      let content = mdToHtml(md, loc, seo, imgs.map((i) => i.urlPath));

      const lp = (p: string) => localizePath(loc, p);
      const items: string[] = [];
      for (const p of product as NonNullable<(typeof product)[number]>[]) {
        const t = p.translations.find((x) => x.locale === loc);
        if (!t) { warn(`${loc}: ürün çevirisi yok ${p.slug}`); continue; }
        items.push(`<li><a href="${lp(`/urun/${t.slug ?? p.slug}`)}">${cfg.ui.product}: ${esc(t.name)}</a></li>`);
      }
      const ct = cat.translations.find((x) => x.locale === loc);
      if (!ct) warn(`${loc}: kategori çevirisi yok`); else items.push(`<li><a href="${lp(`/urunler/${ct.slug ?? cat.slug}`)}">${cfg.ui.category}: ${esc(ct.name)}</a></li>`);
      for (const b of blogs as NonNullable<(typeof blogs)[number]>[]) {
        const t = b.translations.find((x) => x.locale === loc);
        if (!t) { warn(`${loc}: ilgili blog çevirisi yok ${b.slug}`); continue; }
        items.push(`<li><a href="${lp(`/blog/${loc === "tr" ? b.slug : t.slug}`)}">${esc(t.title)}</a></li>`);
      }
      const bodyOnly = content; // iddia taraması yalnız bu paketin kendi metnine uygulanır; ilgili sayfa bağlantı başlıkları mevcut yazılara aittir
      content += `\n<h2>${cfg.ui.related}</h2>\n<ul>\n${items.join("\n")}\n</ul>\n<p><a href="${lp("/teklif-al")}">${cfg.ui.cta}</a></p>`;
      contents[loc] = content;

      const excerpt = cfg.excerpt ?? seo.excerpt;
      const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      console.log(`  ${loc}: h1(${cfg.h1.length}) seoTitle(${cfg.seoTitle.length}) seoDesc(${seo.meta.length}) excerpt(${excerpt.length}) alt(${seo.alts[0].length}) kelime(${words}) slug=${cfg.slug ?? "(kanonik)"}`);
      if (cfg.seoTitle.length > 45) warn(`${loc}: seoTitle ${cfg.seoTitle.length} > 45`);
      if (seo.meta.length > 160 || seo.meta.length < 110) warn(`${loc}: seoDescription ${seo.meta.length} aralık dışı`);
      if (seo.alts.some((a) => !a || a.length > 170)) warn(`${loc}: alt metni boş/çok uzun`);
      for (const tag of ["p", "h2", "h3", "ul", "li", "figure", "figcaption"]) if (!balanced(content, tag)) warn(`${loc}: <${tag}> dengesiz`);
      if ((content.match(/<figure>/g) ?? []).length !== 2) warn(`${loc}: gövdede 2 <figure> olmalı`);
      if (/<h1/i.test(content)) warn(`${loc}: gövdede H1 var`);

      // Ticari iddia korumaları. REVIEW eşleşmelerinin tamamı elle incelendi (görsellerin foto olmadığı / onay gerektiği yönünde ret ifadeleri);
      // listelenmemiş her eşleşme ve tüm DEFINITE eşleşmeler engeller.
      const all = [cfg.h1, excerpt, cfg.seoTitle, seo.meta, ...seo.alts, ...seo.captions, bodyOnly].join("\n");
      for (const h of scanText(all, loc)) if (h.severity === "DEFINITE" || !cfg.accepted.includes(`${h.rule}:${h.match}`)) warn(`${loc}: ticari iddia ${h.severity}:${h.rule}«${h.match}»`);
      if (loc === "en") {
        const c = findClaims(all).filter((h) => !cfg.accepted.includes(`${h.rule}:${h.match}`)), g = findGatedTerms(all);
        if (c.length || g.length) warn(`en: ${[...c.map((h) => h.rule + "«" + h.match + "»"), ...g.map((h) => h.id + "«" + h.match + "»")].join(", ")}`);
        if (/\b(installation|installed|commission\w*|turnkey|guarantee\w*|certified|leader|best|manufactur\w*)\b/i.test(all)) warn("en: yasak/riskli sözcük");
      }
      if (/anahtar teslim|turnkey|под ключ|schlüsselfertig|clé en main|تسليم المفتاح/i.test(all)) warn(`${loc}: anahtar teslim ifadesi`);
      if (loc !== "tr") {
        const clash = await prisma.blogPostTranslation.findFirst({ where: { locale: loc, slug: cfg.slug! } });
        if (clash && !exists) warn(`${loc}: slug zaten kullanılıyor: ${cfg.slug}`);
      }
    }
    console.log(`  etiketler (${TAGS.length}): ${TAGS.join(", ")}`);

    if (problems) console.log(`\n${problems} uyarı var.`);
    if (!APPLY) { console.log("\nKuru çalıştırma (DB/S3'e yazılmadı). Uygulamak için: --apply"); process.exitCode = problems ? 1 : 0; return; }
    if (problems) throw new Error("Uyarılar giderilmeden uygulanmaz.");
    if (exists) { console.log("Yazı zaten var; yazılmadı."); return; }

    const s3 = getS3();
    for (const im of imgs) {
      await s3.send(new PutObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: `uploads/${im.key}`, Body: im.data, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
      console.log(`S3'e yüklendi: uploads/${im.key}`);
    }
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      for (const [i, im] of imgs.entries()) {
        if (await tx.media.findUnique({ where: { storageKey: im.key } })) continue;
        await tx.media.create({ data: { filename: im.key, originalName: im.file.split(/[\\/]/).pop()!, mimeType: "image/webp", url: im.urlPath, storageKey: im.key, alt: seos.tr.alts[i], width: 1600, height: 900, fileSize: im.data.length } });
      }
      const tagIds: string[] = [];
      for (const name of TAGS) {
        const slug = slugify(name);
        const tag = (await tx.blogTag.findUnique({ where: { slug } })) ?? (await tx.blogTag.create({ data: { slug, name } }));
        tagIds.push(tag.id);
      }
      await tx.blogPost.create({
        data: {
          slug: POST_SLUG, categoryId: category.id, coverImage: imgs[0].urlPath, coverImageAlt: seos.tr.alts[0], authorType: "company", status: "PUBLISHED", featured: false,
          publishedAt: now, createdAt: now, tags: { connect: tagIds.map((id) => ({ id })) },
          relatedProducts: { connect: (product as NonNullable<(typeof product)[number]>[]).map((p) => ({ id: p.id })) },
          translations: { create: LOCALES.map((loc) => ({ locale: loc, slug: CFG[loc].slug, title: CFG[loc].h1, excerpt: CFG[loc].excerpt ?? seos[loc].excerpt, content: contents[loc], seoTitle: CFG[loc].seoTitle, seoDescription: seos[loc].meta, imageAlt: seos[loc].alts[0] })) },
        },
      });
    }, { maxWait: 10000, timeout: 60000 });
    console.log(`DB'ye eklendi: ${POST_SLUG} (6 dil, ${TAGS.length} etiket, 3 medya)`);

    const check = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    try {
      const p = await check.blogPost.findUnique({ where: { slug: POST_SLUG }, include: { translations: true, tags: true, relatedProducts: true } });
      console.log(`doğrulama: durum ${p?.status}, yayın ${p?.publishedAt?.toISOString()}, çeviri ${p?.translations.length}, etiket ${p?.tags.length}, ürün ${p?.relatedProducts.length}, kapak ${p?.coverImage}`);
    } finally { await check.$disconnect(); }
  } finally { await prisma.$disconnect(); }
}

main().catch((e) => { console.error(String(e instanceof Error ? e.message : e).replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, "[redacted-url]").slice(0, 600)); process.exitCode = 1; });
