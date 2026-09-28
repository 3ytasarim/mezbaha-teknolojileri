/**
 * Phase 11D: eski sitedeki GERÇEK Kataloglar / Videolar içeriğini yerel varlıklara çevirir.
 *
 *  - Katalog: /tr/mezbaha-makina-sistemleri-katalog/ içindeki 155 sayfa görseli (kaynakta bir PDF
 *    DEĞİL, owl-carousel görsel galerisi) + kapak görseli (/tr/kataloglar/).
 *  - Videolar: /tr/mezbaha-sistemleri-videolar-941/ içindeki 17 YouTube gömmesi. Eski sayfada
 *    başlık/açıklama YOKTUR; başlık ve kanal adı YouTube oEmbed'den (videonun kendi meta verisi)
 *    alınır ve `titleSource` ile işaretlenir. Küçük resimler yerel kopyalanır (üçüncü taraf istek yok).
 *
 * Nazik tarama: 2 eşzamanlı, istekler arası bekleme, üstel geri çekilmeli yeniden deneme.
 * Tekrar çalıştırılabilir (mevcut, doğrulanmış dosyalar atlanır). DB'ye yazmaz.
 * Çıktılar: public/images/migrated/{catalog,videos}/..., src/content/legacy/{catalogs,videos}.json,
 *           docs/migration-provenance-legacy.json
 */
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";

const ROOT = path.join(__dirname, "..", "..");
const UA = "MezbahaMigrationBot/1.0 (+content migration)";
const ORIGIN = "https://www.mezbahateknolojileri.com";
const CATALOG_URL = ORIGIN + "/tr/mezbaha-makina-sistemleri-katalog/";
const CATALOG_LIST_URL = ORIGIN + "/tr/kataloglar/";
const VIDEOS_URL = ORIGIN + "/tr/mezbaha-sistemleri-videolar-941/";
const CATALOG_SLUG = "2018-mezbaha-sistemleri-katalog";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
const now = new Date().toISOString();

async function fetchRetry(url: string, init: RequestInit = {}, tries = 4): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) } });
      if (res.ok) return res;
      last = new Error("HTTP " + res.status + " " + url);
      if (res.status === 404) break;
    } catch (e) {
      last = e;
    }
    await sleep(600 * 2 ** i);
  }
  throw last;
}

function isJpeg(b: Buffer) {
  return b.length > 4 && b[0] === 0xff && b[1] === 0xd8;
}

async function pool<T>(items: T[], size: number, fn: (i: T, idx: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const idx = next++;
        await fn(items[idx], idx);
        await sleep(200);
      }
    })
  );
}

type Prov = { entity: string; slug: string; sourceUrl: string; sourceHash: string; bytes: number; localPath: string; importedAt: string };

async function downloadImage(url: string, dest: string, prov: Prov[], entity: string, slug: string): Promise<{ ok: boolean; bytes: number }> {
  const rel = path.relative(ROOT, dest).split(path.sep).join("/");
  mkdirSync(path.dirname(dest), { recursive: true });
  let buf: Buffer;
  if (existsSync(dest) && isJpeg(readFileSync(dest))) {
    buf = readFileSync(dest);
  } else {
    const res = await fetchRetry(url);
    buf = Buffer.from(await res.arrayBuffer());
    if (!isJpeg(buf)) throw new Error("JPEG değil: " + url);
    writeFileSync(dest, buf);
  }
  prov.push({ entity, slug, sourceUrl: url, sourceHash: sha(buf), bytes: buf.length, localPath: rel, importedAt: now });
  return { ok: true, bytes: buf.length };
}

async function main() {
  const prov: Prov[] = [];
  const failures: string[] = [];

  // ---------- Katalog ----------
  const catHtml = await (await fetchRetry(CATALOG_URL)).text();
  const $c = cheerio.load(catHtml);
  const pageUrls = $c("img.lazy-img[data-src*='gallery_images']").map((_, e) => $c(e).attr("data-src")!).get();
  const counter = $c(".pages").text().replace(/\s+/g, "");
  const title = $c("h1").first().text().trim();
  console.log("Katalog:", title, "| sayfa görseli:", pageUrls.length, "| sayaç:", counter);
  if (pageUrls.length === 0 || !counter.endsWith("/" + pageUrls.length)) throw new Error("Sayfa sayısı sayaçla uyuşmuyor: " + counter + " vs " + pageUrls.length);

  const listHtml = await (await fetchRetry(CATALOG_LIST_URL)).text();
  const $l = cheerio.load(listHtml);
  const coverImg = $l("img.lazy-img[data-src*='/uploads/gallery/gallery_']").first();
  const coverUrl = coverImg.attr("data-src")!;
  const coverAlt = coverImg.attr("alt") ?? "";
  const dirRel = "public/images/migrated/catalog/" + CATALOG_SLUG;
  await downloadImage(coverUrl, path.join(ROOT, dirRel, "cover.jpg"), prov, "catalogCover", CATALOG_SLUG);

  let totalBytes = 0;
  await pool(pageUrls, 2, async (url, idx) => {
    const name = "page-" + String(idx + 1).padStart(3, "0") + ".jpg";
    try {
      const r = await downloadImage(url, path.join(ROOT, dirRel, name), prov, "catalogPage", CATALOG_SLUG + "#" + (idx + 1));
      totalBytes += r.bytes;
    } catch (e) {
      failures.push(url + " -> " + String(e));
    }
    if ((idx + 1) % 25 === 0) console.log("  sayfa", idx + 1, "/", pageUrls.length);
  });

  // görsel boyutu (kaynak width/height öznitelikleri: 1280x720)
  const w = Number($c("img.lazy-img[data-src*='gallery_images']").first().attr("width") ?? 0);
  const h = Number($c("img.lazy-img[data-src*='gallery_images']").first().attr("height") ?? 0);

  const catalogs = [
    {
      slug: CATALOG_SLUG,
      title,
      sourceUrl: CATALOG_URL,
      listSourceUrl: CATALOG_LIST_URL,
      cover: { path: "/images/migrated/catalog/" + CATALOG_SLUG + "/cover.jpg", alt: coverAlt, width: Number(coverImg.attr("width") ?? 600), height: Number(coverImg.attr("height") ?? 350) },
      pageCount: pageUrls.length,
      pageWidth: w,
      pageHeight: h,
      pagePathPattern: "/images/migrated/catalog/" + CATALOG_SLUG + "/page-{NNN}.jpg",
      format: "image-gallery",
      note: "Kaynakta PDF değil, sayfa görsellerinden oluşan bir galeri (owl-carousel). Yıl başlıktan: 2018.",
      pageSourceUrls: pageUrls,
    },
  ];
  mkdirSync(path.join(ROOT, "src", "content", "legacy"), { recursive: true });
  writeFileSync(path.join(ROOT, "src", "content", "legacy", "catalogs.json"), JSON.stringify(catalogs, null, 2), "utf-8");

  // ---------- Videolar ----------
  const vHtml = await (await fetchRetry(VIDEOS_URL)).text();
  const $v = cheerio.load(vHtml);
  const pageTitle = $v("h1").first().text().trim();
  const metaDescription = $v("meta[name=description]").attr("content") ?? null;
  const ids = $v("iframe[src*='youtube']")
    .map((_, e) => ($v(e).attr("src") ?? "").match(/embed\/([^?]+)/)?.[1] ?? "")
    .get()
    .filter(Boolean);
  console.log("Videolar:", ids.length, "| benzersiz:", new Set(ids).size);

  const videos: {
    id: string; order: number; title: string | null; titleSource: "youtube-oembed" | null;
    channel: string | null; channelUrl: string | null; thumbnail: string | null; thumbnailSource: string | null;
    watchUrl: string; sourceEmbed: string;
    available: boolean; unavailableReason: string | null;
  }[] = [];

  await pool(ids, 2, async (id, idx) => {
    const embed = $v("iframe[src*='" + id + "']").first().attr("src") ?? "";
    let vtitle: string | null = null, channel: string | null = null, channelUrl: string | null = null;
    try {
      const o = await fetchRetry("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id));
      const j = (await o.json()) as { title?: string; author_name?: string; author_url?: string };
      vtitle = j.title ?? null;
      channel = j.author_name ?? null;
      channelUrl = j.author_url ?? null;
    } catch (e) {
      failures.push("oembed " + id + " -> " + String(e));
    }
    let thumbPath: string | null = null, thumbSrc: string | null = null;
    for (const q of ["maxresdefault", "sddefault", "hqdefault"]) {
      const url = "https://i.ytimg.com/vi/" + id + "/" + q + ".jpg";
      try {
        await downloadImage(url, path.join(ROOT, "public", "images", "migrated", "videos", id + ".jpg"), prov, "videoThumbnail", id);
        thumbPath = "/images/migrated/videos/" + id + ".jpg";
        thumbSrc = url;
        break;
      } catch {
        /* sonraki kaliteyi dene */
      }
    }
    if (!thumbPath) failures.push("thumbnail " + id);
    videos[idx] = {
      id, order: idx + 1, title: vtitle, titleSource: vtitle ? "youtube-oembed" : null, channel, channelUrl,
      thumbnail: thumbPath, thumbnailSource: thumbSrc, watchUrl: "https://www.youtube.com/watch?v=" + id, sourceEmbed: embed,
      // oEmbed + küçük resim yoksa video herkese açık oynatılamıyor (ör. "Gizli video"); yayınlanmaz, kayıt korunur.
      available: Boolean(vtitle && thumbPath),
      unavailableReason: vtitle && thumbPath ? null : "YouTube herkese açık meta veri/küçük resim döndürmedi (video gizli/kaldırılmış olabilir; eski sitede de oynatılamıyor)",
    };
  });

  writeFileSync(
    path.join(ROOT, "src", "content", "legacy", "videos.json"),
    JSON.stringify({ sourceUrl: VIDEOS_URL, pageTitle, metaDescription, importedAt: now, videos }, null, 2),
    "utf-8"
  );

  // ---------- Provenance ----------
  prov.push({ entity: "videoGallery", slug: "videolar", sourceUrl: VIDEOS_URL, sourceHash: sha(JSON.stringify(ids)), bytes: 0, localPath: "src/content/legacy/videos.json", importedAt: now });
  prov.push({ entity: "catalog", slug: CATALOG_SLUG, sourceUrl: CATALOG_URL, sourceHash: sha(JSON.stringify(pageUrls)), bytes: totalBytes, localPath: "src/content/legacy/catalogs.json", importedAt: now });
  const provPath = path.join(ROOT, "docs", "migration-provenance-legacy.json");
  const prev: Prov[] = existsSync(provPath) ? JSON.parse(readFileSync(provPath, "utf-8")).records : [];
  const prevMap = new Map(prev.map((p) => [p.entity + "|" + p.slug + "|" + p.sourceUrl, p]));
  const merged = prov.map((p) => {
    const o = prevMap.get(p.entity + "|" + p.slug + "|" + p.sourceUrl);
    return o && o.sourceHash === p.sourceHash ? { ...p, importedAt: o.importedAt } : p; // ilk import zamanını koru
  });
  writeFileSync(provPath, JSON.stringify({ updatedAt: now, count: merged.length, records: merged }, null, 2), "utf-8");

  console.log(JSON.stringify({ catalogPages: pageUrls.length, catalogMB: +(totalBytes / 1048576).toFixed(1), videos: videos.length, withTitle: videos.filter((v) => v.title).length, withThumb: videos.filter((v) => v.thumbnail).length, failures }, null, 1));
  if (failures.length) process.exitCode = 2;
  void statSync;
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
