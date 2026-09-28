import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

/**
 * Büyükbaş kategorisinin ürünlerini canlı siteden çıkarır (deterministik, LLM'siz).
 * - Sıralı istek + gecikme + retry/backoff (production siteye yük bindirmez)
 * - Ham HTML scratch cache'e yazılır; parse cache'ten yapılır
 * - Çıktı her üründen sonra diske yazılır (kesinti olursa ilerleme kaybolmaz)
 * - Görseller içerik hash'iyle mevcut indirilmiş dosyalara eşlenir (duplicate yok)
 */

const ROOT = path.join(__dirname, "..", "..");
const BASE = "https://www.mezbahateknolojileri.com";
const CATEGORY_URL = `${BASE}/tr/buyukbas-mezbaha-makinalari/`;
const OUT_PATH = path.join(ROOT, "docs", "migration-data", "products-buyukbas.json");
const CACHE_DIR = path.join(os.tmpdir(), "mezbaha-src-cache");
const IMG_ROOT = path.join(ROOT, "public", "images", "migrated", "products");
const UA = "Mozilla/5.0 (compatible; content-migration/1.0)";
const DELAY_MS = 500;

mkdirSync(CACHE_DIR, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, binary = false): Promise<Buffer | string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (error) {
      lastError = error;
      await sleep(600 * attempt * attempt);
    }
  }
  throw new Error(`${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function getHtml(url: string): Promise<string> {
  const key = createHash("sha1").update(url).digest("hex") + ".html";
  const file = path.join(CACHE_DIR, key);
  if (existsSync(file)) return readFileSync(file, "utf-8");
  const html = (await fetchWithRetry(url)) as string;
  writeFileSync(file, html, "utf-8");
  await sleep(DELAY_MS);
  return html;
}

// ---------- Slate markup -> temiz semantik HTML ----------

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const norm = (s: string) => s.replace(/\s+/g, " ");

function isTag(node: AnyNode): node is Element {
  return node.type === "tag";
}

function hasClass($el: cheerio.Cheerio<Element>, part: string) {
  return ($el.attr("class") ?? "").includes(part);
}

function inline($: cheerio.CheerioAPI, nodes: AnyNode[]): string {
  let out = "";
  for (const node of nodes) {
    if (node.type === "text") {
      out += esc(norm((node as unknown as { data: string }).data));
      continue;
    }
    if (!isTag(node)) continue;
    const $el = $(node);
    if (hasClass($el, "li-decorator")) continue;
    const name = node.name.toLowerCase();
    const inner = inline($, node.children as AnyNode[]);
    if (name === "br") out += " ";
    else if (name === "a") {
      const href = $el.attr("href") ?? "";
      out += /^(https?:|mailto:|tel:|\/)/.test(href) ? `<a href="${esc(href)}">${inner}</a>` : inner;
    } else if (
      name === "strong" ||
      name === "b" ||
      hasClass($el, "font-[600]") ||
      hasClass($el, "font-bold") ||
      /font-weight:\s*(bold|[6-9]00)/i.test($el.attr("style") ?? "")
    ) {
      out += inner.trim() ? `<strong>${inner}</strong>` : inner;
    } else if (name === "em" || name === "i" || hasClass($el, "italic")) {
      out += inner.trim() ? `<em>${inner}</em>` : inner;
    } else if (name === "img" || name === "script" || name === "style") {
      continue;
    } else out += inner;
  }
  return out;
}

function tableHtml($: cheerio.CheerioAPI, table: Element): string {
  const rows: string[] = [];
  $(table)
    .find("tr")
    .each((_, tr) => {
      const cells: string[] = [];
      $(tr)
        .children("td,th")
        .each((__, cell) => {
          const tag = cell.name.toLowerCase() === "th" ? "th" : "td";
          cells.push(`<${tag}>${inline($, cell.children as AnyNode[]).trim()}</${tag}>`);
        });
      if (cells.length) rows.push(`<tr>${cells.join("")}</tr>`);
    });
  return rows.length ? `<table><tbody>${rows.join("")}</tbody></table>` : "";
}

function blocks($: cheerio.CheerioAPI, nodes: AnyNode[], out: string[], list: { ordered: boolean; items: string[] }) {
  const flush = () => {
    if (list.items.length) {
      const tag = list.ordered ? "ol" : "ul";
      out.push(`<${tag}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`);
      list.items = [];
    }
  };

  let pending: AnyNode[] = [];
  const flushInline = () => {
    if (!pending.length) return;
    const t = inline($, pending).trim();
    pending = [];
    if (t) {
      flush();
      out.push(`<p>${t}</p>`);
    }
  };

  for (const node of nodes) {
    if (node.type === "text") {
      pending.push(node);
      continue;
    }
    if (!isTag(node)) continue;
    const $el = $(node);
    const name = node.name.toLowerCase();

    if (INLINE_TAGS.has(name)) {
      pending.push(node);
      continue;
    }
    flushInline();

    if (/^h[1-6]$/.test(name)) {
      const t = inline($, node.children as AnyNode[]).trim();
      if (t) {
        flush();
        out.push(name === "h1" || name === "h2" ? `<h2>${t}</h2>` : `<h3>${t}</h3>`);
      }
    } else if (name === "p") {
      const t = inline($, node.children as AnyNode[]).trim();
      if (t) {
        flush();
        out.push(`<p>${t}</p>`);
      }
    } else if (name === "ul" || name === "ol") {
      flush();
      const items = $el
        .children("li")
        .map((_, li) => inline($, li.children as AnyNode[]).trim())
        .get()
        .filter(Boolean);
      if (items.length) out.push(`<${name}>${items.map((i) => `<li>${i}</li>`).join("")}</${name}>`);
    } else if (name === "table") {
      flush();
      const t = tableHtml($, node);
      if (t) out.push(t);
    } else if (name === "div" || name === "section") {
      const decorator = $el.find(".li-decorator").first();
      const isSlateListItem =
        decorator.length > 0 && $el.find("h1,h2,h3,table,div[data-slate-node='element']").length === 0;
      if (isSlateListItem) {
        const ordered = /^\d+[.)]?$/.test(decorator.text().trim());
        if (list.items.length && list.ordered !== ordered) flush();
        list.ordered = ordered;
        const t = inline($, node.children as AnyNode[]).trim();
        if (t) list.items.push(t);
        continue;
      }
      const hasBlockChild = $el.find("h1,h2,h3,h4,h5,h6,table,ul,ol,p,div,section").length > 0;
      if (!hasBlockChild) {
        const t = inline($, node.children as AnyNode[]).trim();
        if (t) {
          flush();
          out.push(`<p>${t}</p>`);
        }
      } else {
        blocks($, node.children as AnyNode[], out, list);
      }
    } else {
      // Bilinmeyen blok etiketi: içeriğine in
      blocks($, node.children as AnyNode[], out, list);
    }
  }
  flushInline();
  flush();
}

const INLINE_TAGS = new Set(["span", "a", "strong", "b", "em", "i", "u", "br", "small", "sup", "sub", "mark", "font", "abbr"]);

export function toCleanHtml($: cheerio.CheerioAPI, container: cheerio.Cheerio<Element>): string {
  const out: string[] = [];
  blocks($, container.get(0)!.children as AnyNode[], out, { ordered: false, items: [] });
  return out.join("\n");
}

// ---------- Teknik özellik tablolarını ProductSpecification satırlarına çevir ----------

const plain = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Yalnızca gerçekten "etiket | değer" teknik tablolarını çıkarır: tam 2 sütun, en az 2 veri
 * satırı, etiket kısa ve ":" ile bitmiyor, değer kısa (pazarlama cümleleri değil). Değerler
 * kaynakta yazdığı gibi korunur (birim dönüşümü/tahmin yok). Çıkarılan tablo ve hemen
 * öncesindeki "Teknik ..." başlığı açıklamadan silinir (spec bölümünde zaten gösterilecek).
 */
export function pullSpecs(html: string): { html: string; specs: { label: string; value: string }[] } {
  const specs: { label: string; value: string }[] = [];
  let out = html;

  for (const match of html.match(/<table>[\s\S]*?<\/table>/g) ?? []) {
    const rows = [...match.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/g)].map((c) => plain(c[1]))
    ).filter((r) => r.some(Boolean));
    if (rows.length < 2 || rows.some((r) => r.length !== 2)) continue;
    const dataRows = /^(özellik|parametre|teknik özellik|başlık)$/i.test(rows[0][0]) ? rows.slice(1) : rows;
    if (dataRows.length < 2) continue;
    const looksLikeSpecs = dataRows.every(([label, value]) => label && value && label.length <= 60 && value.length <= 120 && !label.endsWith(":"));
    if (!looksLikeSpecs) continue;

    specs.push(...dataRows.map(([label, value]) => ({ label, value })));
    const idx = out.indexOf(match);
    const before = out.slice(0, idx).replace(/<h[23]>(?:(?!<\/h[23]>)[\s\S])*teknik(?:(?!<\/h[23]>)[\s\S])*<\/h[23]>\s*$/i, "");
    out = before + out.slice(idx + match.length);
  }

  return { html: out.replace(/\n{2,}/g, "\n").trim(), specs };
}

// ---------- Görsel indirme (hash ile dedupe) ----------

function sniffExt(buf: Buffer): string | null {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length > 6 && buf.toString("ascii", 0, 3) === "GIF") return "gif";
  return null;
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

async function materializeImage(folder: string, url: string, index: number, stats: { reused: number; downloaded: number; skipped: string[] }) {
  const buf = (await fetchWithRetry(url, true)) as Buffer;
  await sleep(250);
  const ext = sniffExt(buf);
  if (!ext || buf.length < 3000) {
    stats.skipped.push(`${url} (${ext ? "çok küçük" : "geçersiz format"})`);
    return null;
  }

  const dir = path.join(IMG_ROOT, folder);
  mkdirSync(dir, { recursive: true });
  const hash = sha(buf);
  for (const f of readdirSync(dir)) {
    const existing = readFileSync(path.join(dir, f));
    if (sha(existing) === hash) {
      stats.reused += 1;
      return `public/images/migrated/products/${folder}/${f}`;
    }
  }

  const file = `${folder}-${String(index + 1).padStart(2, "0")}.${ext}`;
  writeFileSync(path.join(dir, file), buf);
  stats.downloaded += 1;
  return `public/images/migrated/products/${folder}/${file}`;
}

// ---------- Ana akış ----------

type Product = Record<string, unknown>;

async function main() {
  const catHtml = await getHtml(CATEGORY_URL);
  const $c = cheerio.load(catHtml);
  const listing: { url: string; name: string }[] = [];
  const seen = new Set<string>();
  $c(".services .item").each((_, el) => {
    const href = $c(el).find("a").first().attr("href");
    if (!href || seen.has(href)) return;
    seen.add(href);
    listing.push({ url: href, name: norm($c(el).text()).trim() });
  });
  console.log(`Kategori sayfasında ${listing.length} ürün bulundu.`);

  const products: Product[] = [];
  const errors: { url: string; reason: string }[] = [];
  const imgStats = { reused: 0, downloaded: 0, skipped: [] as string[] };

  const save = () =>
    writeFileSync(
      OUT_PATH,
      JSON.stringify({ products, categorySourceUrl: CATEGORY_URL, errors, imageSkipped: imgStats.skipped }, null, 2),
      "utf-8"
    );

  for (const { url, name: listName } of listing) {
    try {
      const html = await getHtml(url);
      const $ = cheerio.load(html);

      const name = norm($("h1.title").first().text()).trim() || listName;
      const seoTitle = norm($("title").first().text()).trim() || null;
      const seoDescription = $('meta[name="description"]').attr("content")?.trim() || null;

      const textEl = $(".content .inner .col-md-6 .text").first();
      const rawDescriptionHtml = textEl.length ? toCleanHtml($, textEl) : "";
      const { html: descriptionHtml, specs } = pullSpecs(rawDescriptionHtml);

      const imageUrls: { url: string; alt: string }[] = [];
      const seenImg = new Set<string>();
      $(".service_images img").each((_, img) => {
        const src = $(img).attr("data-src") || $(img).attr("src");
        if (!src || seenImg.has(src)) return;
        seenImg.add(src);
        imageUrls.push({ url: src, alt: $(img).attr("alt")?.trim() || name });
      });

      const documents: { sourceUrl: string; title: string }[] = [];
      $(".content a[href$='.pdf']").each((_, a) => {
        documents.push({ sourceUrl: $(a).attr("href")!, title: norm($(a).text()).trim() || name });
      });

      const videoUrl = $(".content iframe[src*='youtube'], .content iframe[src*='vimeo']").first().attr("src") ?? null;

      const folder = new URL(url).pathname.replace(/^\/tr\//, "").replace(/\/$/, "");
      const localImages: { sourceUrl: string; localPath: string; alt: string }[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const localPath = await materializeImage(folder, imageUrls[i].url, i, imgStats);
          if (localPath) localImages.push({ sourceUrl: imageUrls[i].url, localPath, alt: imageUrls[i].alt });
        } catch (error) {
          imgStats.skipped.push(`${imageUrls[i].url} (${error instanceof Error ? error.message : "hata"})`);
        }
      }

      products.push({
        sourceUrl: url,
        name,
        categorySourceUrl: CATEGORY_URL,
        shortDescription: seoDescription,
        descriptionHtml,
        specifications: specs,
        applications: null,
        features: null,
        sku: null,
        images: imageUrls.map((i) => ({ sourceUrl: i.url, alt: i.alt })),
        coverImageSourceUrl: imageUrls[0]?.url ?? null,
        documents,
        videoUrl,
        seoTitle,
        seoDescription,
        localImages,
      });
      console.log(`✓ ${name} — desc ${descriptionHtml.length} chars, ${localImages.length}/${imageUrls.length} görsel`);
    } catch (error) {
      errors.push({ url, reason: error instanceof Error ? error.message : String(error) });
      console.log(`✗ ${url}: ${errors[errors.length - 1].reason}`);
    }
    save();
  }

  console.log(
    `\nBitti: ${products.length} ürün, ${errors.length} hata. Görsel: ${imgStats.downloaded} yeni, ${imgStats.reused} yeniden kullanıldı (hash eşleşmesi), ${imgStats.skipped.length} atlandı.`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
