/**
 * 07.11.2026 — 3 bağımsız blog yazısı × 6 dil (TR/EN/RU/DE/FR/AR) = 18 sayfa. Varsayılan DRY-RUN; yazmak için --apply.
 *   - Kaynak: blog-2026-11-07/source (posts/<yazı>/<dil>.md + seo/<yazı>/<dil>.json, harici paketten aynen). Her yazının TEK görseli: images/.
 *   - Her yazı = tek BlogPost (tek çeviri grubu). Kanonik slug Türkçe; diğer dillerde dile özgü slug (site kuralı; AR slug = EN slug).
 *     Canonical/hreflang kodla üretilir (kendine canonical); `canonicalUrl` bilerek boş (sayfa onu PATH olarak okur).
 *   - Görsel = kapak (sayfa şablonu 16:9 tam gösterir, listede de tam görünür); og:image = pakettaki 1200x630 JPEG (translation.ogImage).
 *     800/1200w varyantları yüklenmez: next/image mevcut hattı 1600 px kaynaktan üretir.
 *   - Paket metninden yalnız TİCARİ KURAL uyumu için küçük düzeltmeler yapılır (devreye alma/montaj hizmeti ima eden cümleler,
 *     başlıklarda "design/tasarım/проект"); her düzeltme tam bir kez eşleşmek zorundadır. Yayın zamanı = uygulama anı (geriye tarihleme yok).
 *   - Veritabanı bağlantısı DIRECT_URL (pooler değil). Yeniden çalıştırılabilir: slug varsa o yazı atlanır.
 * Kullanım: npx tsx prisma/migration/add-blog-posts-3d-2026-11-07.ts [--apply]
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
const DIR = path.join(__dirname, "blog-2026-11-07");

type Seo = { slug: string; h1: string; metaTitle: string; metaDescription: string; excerpt: string; imageSEO: { alt: string; caption: string } };
type LocCfg = {
  slug: string | null; // TR = null (kanonik)
  h1?: string; seoTitle: string; alt?: string; // seoTitle: site " | Mezbaha Teknolojileri" ekler → kısa
  replace?: [string, string][]; // md gövdesinde TAM BİR KEZ eşleşmesi gereken düzeltmeler
  accepted: string[]; // elle incelenmiş ret/olumsuzlama/alıcı-tavsiyesi bağlamındaki REVIEW eşleşmeleri ("KURAL:eşleşme")
};
type PostCfg = {
  key: string; folder: string; slug: string; image: string; og: string; tags: string[]; products: string[];
  locales: Record<Loc, LocCfg>;
};

const POSTS: PostCfg[] = [
  {
    key: "01", folder: "01-workflow", slug: "buyukbas-kesim-hatti-is-akisi-3d",
    image: "cattle-slaughter-line-process-flow-3d", og: "cattle-slaughter-line-process-flow",
    tags: ["Büyükbaş Kesim Hattı İş Akışı", "Büyükbaş Mezbaha Yerleşimi", "Karkas Transfer Sistemi", "Kesim Hattı Ekipman Planlama"],
    products: ["sigir-isleme-hatti"],
    locales: {
      tr: { slug: null, h1: "Büyükbaş Kesim Hattı İş Akışı: 3D Görünümde Transfer Noktalarını Planlamak", seoTitle: "Büyükbaş Kesim Hattı İş Akışı: 3D Planlama", alt: "Büyükbaş kesim hattında transfer sistemlerini, üst rayları ve karkas işleme platformlarını gösteren 3D görünüm", accepted: ["CERTIFICATION:onaylı", "CERTIFICATION:USDA", "PLANT_DESIGN:mezbaha tasarım"] },
      en: { slug: "cattle-slaughter-line-process-flow-3d", seoTitle: "Cattle Slaughter Line Process Flow in 3D", replace: [["Is a 3D slaughter line image an installation drawing?", "Is a 3D slaughter line image a working drawing?"]], accepted: ["PLANT_DESIGN:plant design", "CERTIFICATION:USDA"] },
      ru: { slug: "liniya-uboya-krs-tekhnologicheskiy-potok-3d", seoTitle: "Поток линии убоя КРС: 3D-планирование", replace: [["Является ли 3D-изображение монтажным чертежом?", "Является ли 3D-изображение рабочим чертежом?"]], accepted: ["CERTIFICATION:USDA", "PLANT_DESIGN:проектированию бойн"] },
      de: { slug: "rinderschlachtlinie-prozessablauf-3d", seoTitle: "Rinderschlachtlinie: Prozessablauf in 3D", accepted: ["CERTIFICATION:USDA", "CERTIFICATION:Konform"] },
      fr: { slug: "flux-ligne-abattage-bovin-transferts-3d", seoTitle: "Flux d'abattage bovin : transferts en 3D", accepted: ["INSTALL_WORD:installation", "CERTIFICATION:USDA"] },
      ar: { slug: "cattle-slaughter-line-process-flow-3d", h1: "سير العمل في خط ذبح الأبقار: تخطيط نقاط النقل بنموذج ثلاثي الأبعاد", seoTitle: "سير عمل خط ذبح الأبقار بنموذج ثلاثي الأبعاد", alt: "نموذج ثلاثي الأبعاد لخط ذبح الأبقار يوضح مناطق النقل والسكك العلوية ومنصات تجهيز الذبائح", accepted: ["CERTIFICATION:اعتماد", "CERTIFICATION:معتمد", "CERTIFICATION:USDA", "CERTIFICATION:شهادة", "CERTIFICATION:مطابق", "PLANT_DESIGN:تصميم المسالخ"] },
    },
  },
  {
    key: "02", folder: "02-overhead-rail", slug: "mezbaha-ustten-ray-sistemi-karkas-konveyor-3d",
    image: "overhead-meat-rail-beef-carcass-conveyor-3d", og: "overhead-meat-rail-beef-carcass-conveyor",
    tags: ["Mezbaha Üstten Ray Sistemi", "Karkas Konveyörü", "Büyükbaş Karkas Taşıma Sistemi", "Mezbaha Raylı Sistem"],
    products: ["sigir-isleme-hatti", "monray-ikizray"],
    locales: {
      tr: { slug: null, h1: "Mezbaha Üstten Ray Sistemi: Karkas Konveyörü Kontrol Listesi", seoTitle: "Mezbaha Üstten Ray Sistemi: 3D Rehber", replace: [["ve devreye alma kontrol planı isteyin", "ve yapısal varsayımlar isteyin"]], accepted: ["CERTIFICATION:sertifika", "CERTIFICATION:uyumlu", "CERTIFICATION:USDA"] },
      en: { slug: "overhead-meat-rail-system-3d-checklist", h1: "Overhead Meat Rail System: A 3D Carcass Conveyor Checklist", seoTitle: "Overhead Meat Rail System: 3D Checklist", replace: [["for the complete installation.", "for the complete line."], ["exclusions, structural assumptions and commissioning checks", "exclusions and structural assumptions"]], accepted: ["INSTALL_WORD:installation", "INSTALL_WORD:installed", "CERTIFICATION:certif", "CERTIFICATION:USDA"] },
      ru: { slug: "podvesnye-puti-tush-krs-konveyer-3d", h1: "Подвесные пути для туш: 3D-чек-лист конвейера", seoTitle: "Подвесные пути для туш: чек-лист в 3D", replace: [["контрольные мероприятия при вводе в эксплуатацию", "принятые допущения по несущим конструкциям"]], accepted: ["INSTALL_WORD:установк", "CERTIFICATION:USDA"] },
      de: { slug: "rohrbahnsystem-schlachthof-3d-checkliste", seoTitle: "Rohrbahnsystem im Schlachthof: 3D-Checkliste", replace: [["Ausschlüssen und Inbetriebnahmeprüfungen", "Ausschlüssen und statischen Annahmen"]], accepted: ["INSTALL_WORD:installiert", "CERTIFICATION:USDA"] },
      fr: { slug: "rail-aerien-abattoir-convoyeur-carcasses-3d", seoTitle: "Rail aérien d'abattoir : checklist 3D", replace: [["les exclusions et le programme de vérification à la mise en service", "les exclusions et les hypothèses structurelles"]], accepted: ["INSTALL_WORD:installation", "CERTIFICATION:certifi", "CERTIFICATION:USDA"] },
      ar: { slug: "overhead-meat-rail-system-3d-checklist", h1: "نظام السكك العلوية للمسالخ: قائمة مراجعة لناقل الذبائح", seoTitle: "السكك العلوية للمسالخ: دليل ثلاثي الأبعاد", replace: [["والفحوص المقترحة عند التشغيل التجريبي", "والافتراضات الإنشائية"]], accepted: ["CERTIFICATION:شهادة", "CERTIFICATION:اعتماد", "CERTIFICATION:USDA", "WARRANTY_SERVICE:ضمان", "SUPERLATIVE_SOFT:الأفضل"] },
    },
  },
  {
    key: "03", folder: "03-work-platforms", slug: "mezbaha-calisma-platformu-yerlesimi-3d",
    image: "slaughterhouse-work-platform-operator-access-3d", og: "slaughterhouse-work-platform-operator-access",
    tags: ["Mezbaha Çalışma Platformu", "Büyükbaş İşleme Platformu", "Mezbaha Platform Yerleşimi", "Karkas Rayı Operatör Erişimi", "Mezbaha Ergonomi"],
    products: ["sigir-isleme-hatti", "aktarma-platformu"],
    locales: {
      tr: { slug: null, seoTitle: "Mezbaha Çalışma Platformu Yerleşimi 3D", alt: "Büyükbaş işleme hattında merdivenleri ve operatör erişimini gösteren yükseltilmiş çalışma platformları 3D görünümü", replace: [["kurulmuş veya güvenliği belgelenmiş", "faaliyette olan veya güvenliği belgelenmiş"], ["**büyükbaş kesim hattı 3D tasarımı**", "**büyükbaş kesim hattı 3D görünümü**"]], accepted: ["CERTIFICATION:belgelen", "CERTIFICATION:USDA"] },
      en: { slug: "slaughterhouse-work-platform-layout-3d", seoTitle: "Slaughterhouse Work Platform Layout in 3D", accepted: ["INSTALL_WORD:installation", "CERTIFICATION:certif", "CERTIFICATION:USDA", "PLANT_DESIGN:project team", "DESIGN_SERVICE:project team"] },
      ru: { slug: "rabochie-platformy-boyni-dostup-operatora-3d", seoTitle: "Рабочие платформы бойни: доступ в 3D", accepted: ["CERTIFICATION:сертиф", "CERTIFICATION:USDA", "WARRANTY_SERVICE:Гаранти", "PLANT_DESIGN:проектированию бойн"] },
      de: { slug: "arbeitsbuehnen-schlachthof-zugang-3d", seoTitle: "Arbeitsbühnen im Schlachthof: Zugang in 3D", accepted: ["INSTALL_WORD:installiert", "PLANT_DESIGN:Planung von Schlacht", "CERTIFICATION:Konform", "CERTIFICATION:USDA"] },
      fr: { slug: "plateformes-travail-abattoir-acces-operateur-3d", seoTitle: "Plateformes d'abattoir : accès en 3D", accepted: ["INSTALL_WORD:installation", "CERTIFICATION:certifi", "CERTIFICATION:USDA"] },
      ar: { slug: "slaughterhouse-work-platform-layout-3d", seoTitle: "تخطيط منصات العمل في المسالخ بنموذج 3D", alt: "نموذج ثلاثي الأبعاد لمنصات العمل المرتفعة والسلالم ومواقع العاملين بمحاذاة خط تجهيز ذبائح الأبقار", accepted: ["CERTIFICATION:معتمد", "CERTIFICATION:USDA", "CERTIFICATION:اعتماد", "PLANT_DESIGN:تصميم المسالخ"] },
    },
  },
];

const UI: Record<Loc, { related: string; product: string; category: string; cta: string }> = {
  tr: { related: "İlgili sayfalar", product: "Ürün sayfası", category: "Ürün grubu", cta: "Teklif talep edin" },
  en: { related: "Related pages", product: "Product page", category: "Product group", cta: "Request a quote" },
  ru: { related: "Связанные страницы", product: "Страница изделия", category: "Группа изделий", cta: "Запросить предложение" },
  de: { related: "Weiterführende Seiten", product: "Produktseite", category: "Produktgruppe", cta: "Angebot anfordern" },
  fr: { related: "Pages associées", product: "Fiche produit", category: "Gamme", cta: "Demander un devis" },
  ar: { related: "صفحات ذات صلة", product: "صفحة المنتج", category: "مجموعة المنتجات", cta: "اطلب عرض سعر" },
};
const RELATED_EXISTING = ["buyukbas-kesim-hatti-konveyor-ray-sistemleri", "karkas-isleme-istasyonlari-hijyen-ergonomi"];

const TR_MAP: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
const slugify = (s: string) => s.split("").map((c) => TR_MAP[c] ?? c).join("").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const balanced = (h: string, tag: string) => (h.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length === (h.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
const getS3 = () => new S3Client({ endpoint: process.env.STORAGE_ENDPOINT, region: process.env.STORAGE_REGION || "us-east-1", credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY!, secretAccessKey: process.env.STORAGE_SECRET_KEY! }, forcePathStyle: true });

type Resolver = (loc: Loc, href: string) => string;
const inline = (s: string, loc: Loc, resolve: Resolver) =>
  esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t: string, u: string) => `<a href="${resolve(loc, u)}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

/** md → gövde HTML. H1, kapak görseli ve alt yazısı atlanır (sayfa şablonu başlığı ve kapağı kendisi basar). */
function mdToHtml(md: string, loc: Loc, cfg: LocCfg, resolve: Resolver): string {
  let body = md;
  for (const [from, to] of cfg.replace ?? []) {
    const n = body.split(from).length - 1;
    if (n !== 1) throw new Error(`${loc}: düzeltme ${n} kez eşleşti (1 olmalı): ${from}`);
    body = body.replace(from, to);
  }
  const out: string[] = [];
  const lines = body.split(/\r?\n/);
  let imgs = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith("# ")) continue;
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(l)) { imgs++; if (!/^\*[^*]+\*$/.test((lines[i + 2] ?? "").trim())) throw new Error(`${loc}: görsel altında figcaption satırı yok`); i += 2; continue; }
    if (l.startsWith("## ")) { out.push(`<h2>${inline(l.slice(3).trim(), loc, resolve)}</h2>`); continue; }
    if (l.startsWith("### ")) { out.push(`<h3>${inline(l.slice(4).trim(), loc, resolve)}</h3>`); continue; }
    out.push(`<p>${inline(l, loc, resolve)}</p>`);
  }
  if (imgs !== 1) throw new Error(`${loc}: yazıda tam 1 görsel bekleniyordu, ${imgs} bulundu`);
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
    const pcat = await prisma.productCategory.findUnique({ where: { slug: "buyukbas" }, include: { translations: true } });
    if (!pcat) throw new Error("buyukbas ürün kategorisi yok");
    let problems = 0;
    const warn = (m: string) => { problems++; console.log("  UYARI:", m); };

    // Bağlantı çözümleyici: md'deki mutlak EN adresler → dile göre yerelleşmiş site yolu (yalnız gerçekte var olanlar)
    const prodCache = new Map<string, Awaited<ReturnType<typeof prisma.product.findFirst>> & { translations: { locale: string; slug: string | null; name: string }[] }>();
    const blogCache = new Map<string, { slug: string; translations: { locale: string; slug: string | null; title: string }[] }>();
    const loadProduct = async (slugAny: string) => {
      if (prodCache.has(slugAny)) return prodCache.get(slugAny)!;
      const p = (await prisma.product.findUnique({ where: { slug: slugAny }, include: { translations: true } })) ?? (await prisma.product.findFirst({ where: { translations: { some: { locale: "en", slug: slugAny } } }, include: { translations: true } }));
      if (!p) throw new Error(`ürün bulunamadı: ${slugAny}`);
      prodCache.set(slugAny, p as never); return p as never as typeof p & { translations: { locale: string; slug: string | null; name: string }[] };
    };
    const loadBlog = async (slugAny: string) => {
      if (blogCache.has(slugAny)) return blogCache.get(slugAny)!;
      const b = (await prisma.blogPost.findUnique({ where: { slug: slugAny }, include: { translations: true } })) ?? (await prisma.blogPost.findFirst({ where: { translations: { some: { locale: "en", slug: slugAny } } }, include: { translations: true } }));
      if (!b) throw new Error(`blog bulunamadı: ${slugAny}`);
      blogCache.set(slugAny, b); return b;
    };
    const blogHref = (loc: Loc, b: { slug: string; translations: { locale: string; slug: string | null }[] }) => localizePath(loc, `/blog/${loc === "tr" ? b.slug : (b.translations.find((t) => t.locale === loc)?.slug ?? b.slug)}`);
    // md içindeki adresleri önceden çöz (async) → senkron çözümleyici
    const links = new Map<string, string>();
    for (const post of POSTS) for (const loc of LOCALES) {
      const md = fs.readFileSync(path.join(DIR, "source/posts", post.folder, `${loc}.md`), "utf8");
      for (const m of md.matchAll(/\]\((https:\/\/www\.mezbahateknolojileri\.com\/(product|blog)\/([^)\s]+))\)/g)) {
        if (m[2] === "product") { const p = await loadProduct(m[3]); const t = p.translations.find((x) => x.locale === loc); if (!t) throw new Error(`${loc}: ürün çevirisi yok ${m[3]}`); links.set(`${loc}|${m[1]}`, localizePath(loc, `/urun/${t.slug ?? p.slug}`)); }
        else { const b = await loadBlog(m[3]); links.set(`${loc}|${m[1]}`, blogHref(loc, b)); }
      }
      for (const m of md.matchAll(/\]\((https?:[^)]+)\)/g)) if (!links.has(`${loc}|${m[1]}`)) throw new Error(`${loc}: çözülemeyen bağlantı ${m[1]}`);
    }
    const resolve: Resolver = (loc, href) => { const r = links.get(`${loc}|${href}`); if (!r) throw new Error(`çözülemeyen bağlantı ${href}`); return r; };

    const plan: { post: PostCfg; exists: boolean; assets: { webp: { data: Buffer; key: string; urlPath: string }; og: { data: Buffer; key: string; urlPath: string } }; contents: Record<Loc, string>; seos: Record<Loc, Seo> }[] = [];
    for (const post of POSTS) {
      const exists = !!(await prisma.blogPost.findUnique({ where: { slug: post.slug } }));
      console.log(`\n=== Yazı ${post.key}: ${post.slug} ${exists ? "(ZATEN VAR — atlanacak)" : ""}`);
      const mk = (file: string, tag: string) => { const data = fs.readFileSync(path.join(DIR, "images", file)); const key = `${file.replace(/\.[a-z]+$/, "")}-${crypto.createHash("sha1").update(data).digest("hex").slice(0, 8)}${path.extname(file)}`; void tag; return { data, key, urlPath: `/uploads/${key}` }; };
      const webp = mk(`${post.image}.webp`, "webp"), og = mk(`${post.og}-og.jpg`, "og");
      const mw = await sharp(webp.data).metadata(), mo = await sharp(og.data).metadata();
      console.log(`  görsel: ${post.image}.webp ${mw.width}x${mw.height} ${mw.format} ${(webp.data.length / 1024).toFixed(0)} KB | og: ${mo.width}x${mo.height} ${mo.format} ${(og.data.length / 1024).toFixed(0)} KB`);
      if (mw.width !== 1600 || mw.height !== 900 || mw.format !== "webp") warn("ana görsel 1600x900 webp değil");
      if (mo.width !== 1200 || mo.height !== 630 || mo.format !== "jpeg") warn("og görseli 1200x630 jpeg değil");

      const contents = {} as Record<Loc, string>;
      const seos = {} as Record<Loc, Seo>;
      const others = POSTS.filter((p) => p.key !== post.key);
      for (const loc of LOCALES) {
        const cfg = post.locales[loc];
        const seo = JSON.parse(fs.readFileSync(path.join(DIR, "source/seo", post.folder, `${loc}.json`), "utf8")) as Seo;
        seos[loc] = seo;
        const md = fs.readFileSync(path.join(DIR, "source/posts", post.folder, `${loc}.md`), "utf8");
        let content = mdToHtml(md, loc, cfg, resolve);
        const bodyOnly = content;

        const lp = (p: string) => localizePath(loc, p);
        const items: string[] = [];
        for (const ps of post.products) {
          const p = await loadProduct(ps); const t = p.translations.find((x) => x.locale === loc);
          if (!t) { warn(`${loc}: ürün çevirisi yok ${ps}`); continue; }
          items.push(`<li><a href="${lp(`/urun/${t.slug ?? p.slug}`)}">${UI[loc].product}: ${esc(t.name)}</a></li>`);
        }
        const ct = pcat.translations.find((x) => x.locale === loc);
        if (!ct) warn(`${loc}: kategori çevirisi yok`); else items.push(`<li><a href="${lp(`/urunler/${ct.slug ?? pcat.slug}`)}">${UI[loc].category}: ${esc(ct.name)}</a></li>`);
        for (const o of others) { // kardeş yazılar (bağımsız konular; yalnız iç bağlantı, hreflang değil)
          const ol = o.locales[loc];
          const oh1 = ol.h1 ?? (JSON.parse(fs.readFileSync(path.join(DIR, "source/seo", o.folder, `${loc}.json`), "utf8")) as Seo).h1;
          items.push(`<li><a href="${lp(`/blog/${ol.slug ?? o.slug}`)}">${esc(oh1)}</a></li>`);
        }
        for (const es of RELATED_EXISTING) {
          const b = await loadBlog(es); const t = b.translations.find((x) => x.locale === loc);
          if (!t) { warn(`${loc}: ilgili blog çevirisi yok ${es}`); continue; }
          items.push(`<li><a href="${blogHref(loc, b)}">${esc(t.title)}</a></li>`);
        }
        content += `\n<h2>${UI[loc].related}</h2>\n<ul>\n${items.join("\n")}\n</ul>\n<p><a href="${lp("/teklif-al")}">${UI[loc].cta}</a></p>`;
        contents[loc] = content;

        const h1 = cfg.h1 ?? seo.h1, alt = cfg.alt ?? seo.imageSEO.alt;
        seos[loc] = { ...seo, h1, imageSEO: { ...seo.imageSEO, alt } };
        const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
        console.log(`  ${loc}: h1(${h1.length}) seoTitle(${cfg.seoTitle.length}) seoDesc(${seo.metaDescription.length}) excerpt(${seo.excerpt.length}) alt(${alt.length}) kelime(${words}) slug=${cfg.slug ?? "(kanonik)"}`);
        if (cfg.seoTitle.length > 45) warn(`${loc}: seoTitle ${cfg.seoTitle.length} > 45`);
        if (seo.metaDescription.length > 160 || seo.metaDescription.length < 110) warn(`${loc}: metaDescription ${seo.metaDescription.length} aralık dışı`);
        if (!seo.excerpt || alt.length > 170) warn(`${loc}: excerpt boş / alt çok uzun`);
        for (const tag of ["p", "h2", "h3", "ul", "li", "strong", "em", "a"]) if (!balanced(content, tag)) warn(`${loc}: <${tag}> dengesiz`);
        if (/<h1|<img/i.test(content)) warn(`${loc}: gövdede H1/img var`);
        if (/\]\(|\*\*/.test(content.replace(/<[^>]+>/g, " "))) warn(`${loc}: işlenmemiş markdown kalıntısı`);

        // Ticari iddia korumaları: tüm DEFINITE eşleşmeler ve listelenmemiş her REVIEW eşleşmesi engeller (bkz. accepted: elle incelendi).
        const all = [h1, seo.excerpt, cfg.seoTitle, seo.metaDescription, alt, seo.imageSEO.caption, bodyOnly].join("\n");
        for (const h of scanText(all, loc)) if (h.severity === "DEFINITE" || !cfg.accepted.includes(`${h.rule}:${h.match}`)) warn(`${loc}: ticari iddia ${h.severity}:${h.rule}«${h.match}»`);
        if (loc === "en") {
          const c = findClaims(all).filter((h) => !cfg.accepted.includes(`${h.rule}:${h.match}`)), g = findGatedTerms(all);
          if (c.length || g.length) warn(`en: ${[...c.map((h) => h.rule + "«" + h.match + "»"), ...g.map((h) => h.id + "«" + h.match + "»")].join(", ")}`);
          if (/\b(turnkey|guarantee\w*|leader|best|manufactur\w*|commission\w*)\b/i.test(all)) warn("en: yasak/riskli sözcük");
        }
        if (/anahtar teslim|turnkey|под ключ|schlüsselfertig|clé en main|تسليم المفتاح/i.test(all)) warn(`${loc}: anahtar teslim ifadesi`);
        if (loc !== "tr") {
          const clash = await prisma.blogPostTranslation.findFirst({ where: { locale: loc, slug: cfg.slug! } });
          if (clash && !exists) warn(`${loc}: slug zaten kullanılıyor: ${cfg.slug}`);
        }
      }
      console.log(`  etiketler (${post.tags.length}): ${post.tags.join(", ")}`);
      plan.push({ post, exists, assets: { webp, og }, contents, seos });
    }

    if (problems) console.log(`\n${problems} uyarı var.`);
    if (!APPLY) { console.log("\nKuru çalıştırma (DB/S3'e yazılmadı). Uygulamak için: --apply"); process.exitCode = problems ? 1 : 0; return; }
    if (problems) throw new Error("Uyarılar giderilmeden uygulanmaz.");

    const s3 = getS3();
    for (const { post, exists, assets, contents, seos } of plan) {
      if (exists) { console.log(`atlandı (var): ${post.slug}`); continue; }
      for (const [a, ct] of [[assets.webp, "image/webp"], [assets.og, "image/jpeg"]] as const) {
        await s3.send(new PutObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: `uploads/${a.key}`, Body: a.data, ContentType: ct, CacheControl: "public, max-age=31536000, immutable" }));
        console.log(`S3'e yüklendi: uploads/${a.key}`);
      }
      const now = new Date();
      await prisma.$transaction(async (tx) => {
        for (const [a, mime, w, h] of [[assets.webp, "image/webp", 1600, 900], [assets.og, "image/jpeg", 1200, 630]] as const) {
          if (await tx.media.findUnique({ where: { storageKey: a.key } })) continue;
          await tx.media.create({ data: { filename: a.key, originalName: a.key, mimeType: mime, url: a.urlPath, storageKey: a.key, alt: seos.tr.imageSEO.alt, width: w, height: h, fileSize: a.data.length } });
        }
        const tagIds: string[] = [];
        for (const name of post.tags) {
          const slug = slugify(name);
          const tag = (await tx.blogTag.findUnique({ where: { slug } })) ?? (await tx.blogTag.create({ data: { slug, name } }));
          tagIds.push(tag.id);
        }
        const prods = await Promise.all(post.products.map((s) => tx.product.findUniqueOrThrow({ where: { slug: s } })));
        await tx.blogPost.create({
          data: {
            slug: post.slug, categoryId: category.id, coverImage: assets.webp.urlPath, coverImageAlt: seos.tr.imageSEO.alt, authorType: "company", status: "PUBLISHED", featured: false,
            publishedAt: now, createdAt: now, tags: { connect: tagIds.map((id) => ({ id })) }, relatedProducts: { connect: prods.map((p) => ({ id: p.id })) },
            translations: { create: LOCALES.map((loc) => ({ locale: loc, slug: post.locales[loc].slug, title: seos[loc].h1, excerpt: seos[loc].excerpt, content: contents[loc], seoTitle: post.locales[loc].seoTitle, seoDescription: seos[loc].metaDescription, imageAlt: seos[loc].imageSEO.alt, ogImage: assets.og.urlPath })) },
          },
        });
      }, { maxWait: 10000, timeout: 60000 });
      console.log(`DB'ye eklendi: ${post.slug} (6 dil, ${post.tags.length} etiket)`);
      await new Promise((r) => setTimeout(r, 1500)); // üç yazının yayın zamanı birbirinden ayrışsın (gerçek, sıralı zaman damgaları)
    }

    const check = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    try {
      for (const { post } of plan) {
        const p = await check.blogPost.findUnique({ where: { slug: post.slug }, include: { translations: true, tags: true, relatedProducts: true } });
        console.log(`doğrulama ${post.slug}: durum ${p?.status}, yayın ${p?.publishedAt?.toISOString()}, çeviri ${p?.translations.length}, etiket ${p?.tags.length}, ürün ${p?.relatedProducts.length}, kapak ${p?.coverImage}`);
      }
    } finally { await check.$disconnect(); }
  } finally { await prisma.$disconnect(); }
}

main().catch((e) => { console.error(String(e instanceof Error ? e.message : e).replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, "[redacted-url]").slice(0, 600)); process.exitCode = 1; });
