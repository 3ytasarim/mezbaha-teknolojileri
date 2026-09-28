/**
 * Faz 3 — eski sitenin (mezbahateknolojileri.com) İngilizce ve Rusça sayfalarından çeviri kayıtlarını (name/başlık, açıklama,
 * SEO alanları, dile özel slug) veritabanına aktarır: kategori, ürün, blog yazısı.
 *
 * Eşleşme: yeni kayıt → docs/migration-provenance.json'daki eski TR adresi → docs/i18n-inventory.json'daki hreflang
 * karşılıkları (EN/RU). Eski sitenin bilinen eşleşme/çeviri HATALARI aşağıdaki PAIR_OVERRIDES / NAME_FIXES ile düzeltilir;
 * her düzeltme raporda görünür (docs/i18n-import-report.md).
 *
 * KURALLAR: yalnızca EKLER (locale = en/ru satırları); mevcut Türkçe satırlara dokunmaz. Varsayılan KURU ÇALIŞTIRMA
 * (yazmaz, rapor üretir). Uygulamak için: npx tsx prisma/migration/import-translations.ts --apply
 * Geri alma: DELETE FROM "<Tablo>" WHERE locale IN ('en','ru') (docs/i18n-rollback.sql'e bakın). Diller ENABLED_LOCALES'e
 * eklenmeden sitede görünmez.
 */
import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]; // ör. --only=blog
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const ORIGIN = "https://www.mezbahateknolojileri.com";
const CACHE = path.join(os.tmpdir(), "i18n-cache");
mkdirSync(CACHE, { recursive: true });

type Lang = "en" | "ru";
const LANGS: Lang[] = ["en", "ru"];

type InvPage = { lang: string; url: string; title: string; h1: string; description: string; alternates: Record<string, string> };
const inventory: { pages: InvPage[] } = JSON.parse(readFileSync("docs/i18n-inventory.json", "utf8"));
const provenance: { records: { entityType: string; slug: string | null; sourceUrl: string }[] } = JSON.parse(readFileSync("docs/migration-provenance.json", "utf8"));
const invByUrl = new Map(inventory.pages.map((p) => [p.url, p]));

/** Eski sitedeki Polylang eşleşme hataları: TR eski adres → doğru karşılık (dil → eski adres). */
const PAIR_OVERRIDES: Record<string, Partial<Record<Lang, string>>> = {
  // İki blog yazısının İngilizce karşılıkları birbirine karışmış (yer değiştirmiş).
  [`${ORIGIN}/tr/buyukbas-sersemletme-sistemleri/`]: { en: `${ORIGIN}/cattle-stunning-systems-guide/` },
  [`${ORIGIN}/tr/kesim-oncesi-hayvan-stresi-azaltma/`]: { en: `${ORIGIN}/reducing-animal-stress-before-slaughter/` },
};

/** Kaynaktaki bariz çeviri hataları (ad düzeltmesi). Anahtar: özgün başlık (büyük/küçük harf duyarsız). */
const NAME_FIXES: Record<Lang, Record<string, string>> = {
  en: {
    "lung trolley": "Liver Trolley",
    "lung cleaning pan": "Liver Cleaning Pan",
    "channel and grill": "Drain Channel and Grate",
    "slaughterhouse building desing": "Slaughterhouse Building Design",
    "meat deboning worktable": "Meat Cutting Table",
  },
  ru: {
    "сковорода для крови": "Поддон для крови",
    "механическая кожа": "Механический съём шкуры",
    "канал и гриль": "Канал и решётка",
    "стандарты скотобойня скотобойни": "Стандартные системы для скотобоен",
    "mezbaha sistemleri двойной монорельс": "Системы для скотобоен: двойной монорельс",
  },
};

/** Kaynaktaki genel/özensiz ürün adları için elle düzeltmeler (TR slug → ad). Hepsi raporda "ad geçersiz kılındı" olarak görünür. */
const NAME_OVERRIDES: Record<Lang, Record<string, string>> = {
  en: {
    "dairesel-kesim-hucresi": "Circular Stunning Box",
    "hidrolik-deri-yuzme-makinasi": "Hydraulic Skinning Machine",
    "klasik-kesim-hucresi": "Cattle Slaughter Box",
    "monray-ikizray": "Monorail and Twin Rail Systems",
    "profesyonel-mezbaha-sistemleri": "Professional Slaughterhouse Systems",
    "standart-mezbaha-sistemleri": "Standard Slaughterhouse Systems",
    "soguk-oda-ikizray-sistemleri": "Cold Room Monorail and Twin Rail Systems",
    "ikizray-kanca": "Twin Rail Hook",
    "sabit-kuyruk-acma-platformu": "Fixed Tail Opening Platform",
    "sabit-icorgan-platformu": "Fixed Offal Platform",
    "kurutmali-kan-tanki": "Blood Tank With Drying Unit",
  },
  ru: {
    "ayakta-kesim-hucresi": "Бокс оглушения скота ПМ-ФБО",
    "deri-bant-konveyoru": "Линейный конвейер для кожи",
    "ciger-tasima-arabasi": "Тележка для перевозки печени",
  },
};

/** Eski sitedeki yazım hatalı EN slug'ları (eski adres → doğru slug). */
const SLUG_FIXES: Record<string, string> = {
  "government-grants-for-slaugterhouse-setup": "government-grants-for-slaughterhouse-setup",
  "build-slaughterhouse-step-by-step": "build-slaughterhouse-step-by-step",
};

const RU_MAP: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
const slugifyName = (name: string, lang: Lang) =>
  (lang === "ru" ? [...name.toLowerCase()].map((ch) => RU_MAP[ch] ?? ch).join("") : name.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Kategori adları: eski sitenin menü etiketleri (h1'ler genel: "Slaughterhouse Equipment"). */
const CATEGORY_NAMES: Record<Lang, Record<string, string>> = {
  en: { buyukbas: "Cattle Slaughterhouse", kucukbas: "Sheep Slaughterhouse", "kurban-kesim": "Mini Slaughterhouse", "mezbaha-sistemleri": "Slaughterhouse Processing" },
  ru: { buyukbas: "Скотобойня", kucukbas: "Овцебойня", "kurban-kesim": "Мини-скотобойня", "mezbaha-sistemleri": "Переработка мяса" },
};

const decode = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

function titleCaseEn(s: string) {
  const small = new Set(["and", "or", "for", "of", "the", "with", "in", "on", "to", "a", "an"]);
  return s
    .replace(/İ/g, "I")
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
const sentenceCaseRu = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function normalizeName(raw: string, lang: Lang, fixes: string[]): string {
  const key = decode(raw).toLowerCase();
  const fixed = NAME_FIXES[lang][key];
  if (fixed) {
    fixes.push(`ad düzeltildi: "${decode(raw)}" → "${fixed}"`);
    return fixed;
  }
  // "Ad | Sloganı" biçimindeki SEO'lu başlıkların sloganı atılır.
  const name = decode(raw).replace(/\s*\|.*$/, "");
  const isAllCaps = name === name.toUpperCase() && name !== name.toLowerCase();
  if (isAllCaps) {
    const out = lang === "en" ? titleCaseEn(name) : sentenceCaseRu(name);
    fixes.push(`BÜYÜK HARF düzeltildi: "${name}" → "${out}"`);
    return out;
  }
  return name;
}

async function fetchHtml(url: string): Promise<string> {
  const file = path.join(CACHE, Buffer.from(url).toString("base64url").slice(0, 120) + ".html");
  if (existsSync(file)) return readFileSync(file, "utf8");
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (r.ok) {
        const t = await r.text();
        writeFileSync(file, t);
        return t;
      }
    } catch {}
  }
  return "";
}

type Extracted = { h1: string; seoTitle: string; seoDescription: string; bodyHtml: string; bodyImages: string[] };

function extract(html: string, kind: "product" | "category" | "blog" = "product"): Extracted {
  const $ = cheerio.load(html);
  const h1 = decode($("h1.title").first().text() || $("h1").first().text());
  const seoTitle = decode($("title").first().text());
  const seoDescription = decode($('meta[name="description"]').attr("content") ?? "");
  // Blog yazısı gövdesi ürünlerdekinden farklı bir kapta: section.left > .card-body > .content
  const blogBox = $("section.left .card-body .content").first();
  const box = kind === "blog" && blogBox.length ? blogBox : $("div.content .inner .text").first().length ? $("div.content .inner .text").first() : $("div.content .text").first();
  const bodyImages = box
    .find("img")
    .map((_, el) => $(el).attr("src") || $(el).attr("data-src") || "")
    .get();
  return { h1, seoTitle, seoDescription, bodyHtml: box.html() ?? "", bodyImages };
}

const BRAND_SUFFIX = /\s*[-–—|]\s*(Slaughterhouse Technologies|Технологии Скотобойни|Mezbaha Technologies|Mezbaha Teknolojileri)\s*$/i;
const cleanSeoTitle = (t: string) => t.replace(BRAND_SUFFIX, "").trim();

/** Kaynak HTML'i temizler: stil/sınıf/id atılır, img atılır (ürün açıklamalarında zaten yok), kaynak sitesine bağlantılar çözülür. */
function cleanBody(html: string, linkMap: Map<string, string>, keepImages: string[] | null): { html: string; unresolvedLinks: string[] } {
  const unresolved: string[] = [];
  let imgIndex = 0;
  const out = sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "strong", "b", "em", "i", "ul", "ol", "li", "a", "blockquote", "br", "table", "thead", "tbody", "tr", "td", "th", ...(keepImages ? ["img"] : [])],
    allowedAttributes: { a: ["href", "rel", "target"], img: ["src", "alt"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tag, attribs): sanitizeHtml.Tag => {
        const href = attribs.href ?? "";
        const key = href.replace(/^https?:\/\/(www\.)?mezbahateknolojileri\.com/i, ORIGIN).replace(/#.*$/, "");
        const mapped = linkMap.get(key.endsWith("/") ? key : key + "/");
        if (mapped) return { tagName: "a", attribs: { href: mapped } as sanitizeHtml.Attributes };
        if (/mezbahateknolojileri\.com/i.test(href)) {
          unresolved.push(href);
          return { tagName: "span", attribs: {} as sanitizeHtml.Attributes };
        }
        return { tagName: "a", attribs: { href, rel: "noopener noreferrer", target: "_blank" } as sanitizeHtml.Attributes };
      },
      img: (tag, attribs) => {
        if (!keepImages) return { tagName: "img", attribs };
        const replacement = keepImages[imgIndex++];
        return { tagName: "img", attribs: { src: replacement ?? attribs.src ?? "", alt: attribs.alt ?? "" } };
      },
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
    disallowedTagsMode: "discard",
  });
  return { html: out.replace(/\n{3,}/g, "\n\n").replace(/<p>(\s|&nbsp;|&#160;)*<\/p>/g, "").trim(), unresolvedLinks: unresolved };
}

const lastSegment = (url: string) => decodeURI(new URL(url).pathname).split("/").filter(Boolean).pop() ?? "";

type Job = {
  kind: "product" | "category" | "blog";
  id: string;
  trSlug: string;
  trUrl: string;
  trContentImages: string[];
  urls: Partial<Record<Lang, string>>;
};

async function main() {
  const [products, categories, posts] = await Promise.all([
    prisma.product.findMany({ select: { id: true, slug: true } }),
    prisma.productCategory.findMany({ select: { id: true, slug: true } }),
    prisma.blogPost.findMany({ select: { id: true, slug: true, translations: { where: { locale: "tr" }, select: { content: true } } } }),
  ]);

  const provUrl = (type: string, slug: string) => provenance.records.find((r) => r.entityType === type && r.slug === slug)?.sourceUrl;
  const jobs: Job[] = [];
  const missing: string[] = [];

  const push = (kind: Job["kind"], type: string, e: { id: string; slug: string }, trImgs: string[]) => {
    const trUrl = provUrl(type, e.slug);
    const inv = trUrl ? invByUrl.get(trUrl) : undefined;
    if (!trUrl || !inv) {
      missing.push(`${kind}:${e.slug} (eşleşme yok)`);
      return;
    }
    const urls: Job["urls"] = {};
    for (const l of LANGS) {
      const u: string | undefined = PAIR_OVERRIDES[trUrl]?.[l] ?? inv.alternates[l];
      if (u && u !== trUrl) urls[l] = u;
    }
    jobs.push({ kind, id: e.id, trSlug: e.slug, trUrl, trContentImages: trImgs, urls });
  };
  for (const c of categories) push("category", "category", c, []);
  for (const p of products) push("product", "product", p, []);
  for (const b of posts) {
    const imgs = [...(b.translations[0]?.content ?? "").matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    push("blog", "blogPost", b, imgs);
  }

  // Bağlantı haritası: eski dil adresi → yeni yerelleştirilmiş yol (yalnızca aktarılanlar)
  const ROUTE: Record<Job["kind"], string> = { product: "urun", category: "urunler", blog: "blog" };
  const PUB: Record<Lang, Record<string, string>> = {
    en: { urun: "product", urunler: "products", blog: "blog" },
    ru: { urun: "produkt", urunler: "produkty", blog: "blog" },
  };
  // Yeni slug'lar önceki çalıştırmanın eşlemesinden okunur (ilk çalıştırmada eski slug'lar); betik iki kez çalıştırılınca gövde bağlantıları da yeni slug'lara oturur.
  const prevSlugs = new Map<string, string>(existsSync("docs/i18n-slug-map.json") ? (JSON.parse(readFileSync("docs/i18n-slug-map.json", "utf8")) as { oldUrl: string; newSlug: string }[]).map((m) => [m.oldUrl, m.newSlug]) : []);
  const linkMap = new Map<string, string>();
  for (const j of jobs) for (const l of LANGS) if (j.urls[l]) linkMap.set(j.urls[l]!, `/${l}/${PUB[l][ROUTE[j.kind]]}/${prevSlugs.get(j.urls[l]!) ?? lastSegment(j.urls[l]!)}`);
  for (const [l, home] of [["en", `${ORIGIN}/`], ["ru", `${ORIGIN}/ru/`]] as const) linkMap.set(home, `/${l}`);
  // Statik sayfalar
  const STATIC: [string, string, Lang][] = [
    [`${ORIGIN}/corporate/`, "/en/corporate", "en"], [`${ORIGIN}/contact-us/`, "/en/contact-us", "en"], [`${ORIGIN}/catalogs/`, "/en/catalogs", "en"],
    [`${ORIGIN}/ru/kompaniya/`, "/ru/kompaniya", "ru"], [`${ORIGIN}/ru/nashi-kontakty/`, "/ru/nashi-kontakty", "ru"], [`${ORIGIN}/ru/katalogi/`, "/ru/katalogi", "ru"],
  ];
  for (const [u, p] of STATIC) linkMap.set(u, p);

  const report: string[] = [];
  const tally = { written: 0, skippedNoSource: 0, fixes: 0, unresolvedLinks: 0 };
  const usedSlugs: Record<string, Set<string>> = { en: new Set(), ru: new Set() };
  const slugMap: { lang: Lang; kind: string; oldUrl: string; oldSlug: string; newSlug: string; trSlug: string }[] = [];

  for (const job of jobs) {
    if (ONLY && job.kind !== ONLY) continue;
    for (const lang of LANGS) {
      const url = job.urls[lang];
      if (!url) {
        tally.skippedNoSource++;
        report.push(`- ${job.kind} \`${job.trSlug}\` [${lang}]: kaynakta ${lang.toUpperCase()} karşılığı yok — atlandı`);
        continue;
      }
      const html = await fetchHtml(url);
      if (!html) {
        report.push(`- ${job.kind} \`${job.trSlug}\` [${lang}]: sayfa indirilemedi (${url}) — atlandı`);
        continue;
      }
      const ex = extract(html, job.kind);
      const notes: string[] = [];
      const overridden = NAME_OVERRIDES[lang][job.trSlug];
      const name = overridden ?? (job.kind === "category" ? CATEGORY_NAMES[lang][job.trSlug] ?? normalizeName(ex.h1, lang, notes) : normalizeName(ex.h1, lang, notes));
      if (overridden) notes.push(`ad geçersiz kılındı: "${decode(ex.h1)}" → "${overridden}"`);
      const keepImages = job.kind === "blog" && ex.bodyImages.length === job.trContentImages.length && ex.bodyImages.length > 0 ? job.trContentImages : null;
      if (job.kind === "blog" && !keepImages && ex.bodyImages.length > 0) notes.push(`${ex.bodyImages.length} gövde görseli Türkçe yazıdakiyle eşleşmedi — görseller atıldı`);
      const cleaned = cleanBody(ex.bodyHtml, linkMap, keepImages);
      if (cleaned.unresolvedLinks.length) notes.push(`${cleaned.unresolvedLinks.length} eski site bağlantısı çözülemedi (metin bırakıldı)`);
      const oldSlug = lastSegment(url);
      const nameChanged = decode(ex.h1) !== name;
      // Ürün/kategori: EN slug adından üretilir (kaynak slug'lar hatalı yazılmış olabiliyor); RU: kaynak slug, ad düzeltildiyse adından.
      // Blog: kaynak slug (yazım hatası düzeltmesiyle). Eski adres → yeni slug eşlemesi 301 için kaydedilir.
      let slug =
        job.kind === "blog"
          ? SLUG_FIXES[oldSlug] ?? oldSlug
          : lang === "en"
            ? slugifyName(name, lang)
            : nameChanged
              ? slugifyName(name, lang)
              : oldSlug;
      if (slug !== oldSlug) notes.push(`slug: ${oldSlug} → ${slug}`);
      slugMap.push({ lang, kind: job.kind, oldUrl: url, oldSlug, newSlug: slug, trSlug: job.trSlug });
      if (usedSlugs[lang].has(slug)) {
        slug = `${slug}-${job.trSlug}`;
        notes.push("slug çakıştı, TR slug eklendi");
      }
      usedSlugs[lang].add(slug);
      slugMap[slugMap.length - 1].newSlug = slug;

      const seoTitle = cleanSeoTitle(ex.seoTitle) || name;
      const seoDescription = ex.seoDescription || null;
      const shortDescription = seoDescription ? seoDescription.slice(0, 220) : null;
      if (!cleaned.html) notes.push("gövde boş");
      tally.fixes += notes.filter((n) => n.startsWith("ad düzeltildi") || n.startsWith("BÜYÜK")).length;
      tally.unresolvedLinks += cleaned.unresolvedLinks.length;
      report.push(`- ${job.kind} \`${job.trSlug}\` [${lang}] → \`${slug}\` — "${name}" (gövde ${cleaned.html.length} karakter)${notes.length ? " · " + notes.join(" · ") : ""}`);

      if (!APPLY) continue;
      if (job.kind === "product") {
        await prisma.productTranslation.upsert({
          where: { productId_locale: { productId: job.id, locale: lang } },
          create: { productId: job.id, locale: lang, name, slug, shortDescription, description: cleaned.html || null, seoTitle, seoDescription },
          update: { name, slug, shortDescription, description: cleaned.html || null, seoTitle, seoDescription },
        });
      } else if (job.kind === "category") {
        await prisma.productCategoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: job.id, locale: lang } },
          create: { categoryId: job.id, locale: lang, name, slug, shortDescription, description: shortDescription, seoTitle, seoDescription },
          update: { name, slug, shortDescription, description: shortDescription, seoTitle, seoDescription },
        });
      } else {
        await prisma.blogPostTranslation.upsert({
          where: { blogPostId_locale: { blogPostId: job.id, locale: lang } },
          create: { blogPostId: job.id, locale: lang, title: name, slug, excerpt: shortDescription, content: cleaned.html || null, seoTitle, seoDescription },
          update: { title: name, slug, excerpt: shortDescription, content: cleaned.html || null, seoTitle, seoDescription },
        });
      }
      tally.written++;
    }
  }

  const md = [
    "# EN/RU çeviri aktarım raporu",
    "",
    `Mod: ${APPLY ? "UYGULANDI (yazıldı)" : "KURU ÇALIŞTIRMA (veritabanına yazılmadı)"} · ${new Date().toISOString().slice(0, 10)}`,
    "",
    `Kayıt: ${jobs.length} eşleşen varlık · yazılan çeviri: ${tally.written} · kaynakta karşılığı olmayan: ${tally.skippedNoSource} · otomatik ad düzeltmesi: ${tally.fixes} · çözülemeyen eski bağlantı: ${tally.unresolvedLinks}`,
    missing.length ? `\nEşleşmesi bulunamayan varlıklar: ${missing.join(", ")}` : "",
    "",
    "## Ayrıntı",
    ...report,
    "",
  ].join("\n");
  writeFileSync("docs/i18n-import-report.md", md);
  writeFileSync("docs/i18n-slug-map.json", JSON.stringify(slugMap, null, 2));
  console.log(md.split("\n").slice(0, 6).join("\n"));
}

main().finally(() => prisma.$disconnect());
