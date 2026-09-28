import { readFileSync } from "fs";
import path from "path";

export type RedirectRow = {
  oldUrl: string;
  newUrl: string;
  action: "KEEP" | "301";
  notes: string;
};

const ROOT = path.join(__dirname, "..", "..");
const MAP_PATH = path.join(ROOT, "docs", "url-migration-map.md");

// Yalnızca tekil, kesin OLD URL -> tekil, kesin NEW URL satırlarını kabul eder.
// "Doğrulanmadı" / "varsayımsal" olarak işaretli satırlar (ör. §4'teki uluslararası
// proje kartları) ve bir OLD URL'i BİRDEN FAZLA NEW URL'e eşleyen satırlar (ör. §4'teki
// kapasite paketleri satırı) kasıtlı olarak atlanır — bunlar gerçek 1:1 redirect değil.
const ROW_REGEX = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*(KEEP\*?|301)\s*\|(.*)\|$/;

function toPathname(urlOrPath: string): string | null {
  let value = urlOrPath.trim();
  if (value.startsWith("http")) {
    try {
      value = new URL(value).pathname;
    } catch {
      return null;
    }
  }
  if (!value.startsWith("/")) return null;
  if (value.length > 1 && value.endsWith("/")) {
    value = value.slice(0, -1);
  }
  return value;
}

export function parseRedirectMap(): RedirectRow[] {
  const raw = readFileSync(MAP_PATH, "utf-8");
  const lines = raw.split("\n");
  const rows: RedirectRow[] = [];

  for (const line of lines) {
    const match = line.match(ROW_REGEX);
    if (!match) continue;

    const [, oldUrlRaw, newUrlRaw, actionRaw, notes] = match;

    // Birden fazla hedefe eşlenen veya "doğrulanmadı/varsayımsal" notu taşıyan satırları atla.
    if (newUrlRaw.includes(",") || /doğrulanmadı|varsayımsal/i.test(notes)) continue;
    if (oldUrlRaw.startsWith("—")) continue; // "yeni, mevcutta yok" satırı

    const oldPath = toPathname(oldUrlRaw);
    const newPath = toPathname(newUrlRaw);
    if (!oldPath || !newPath) continue;
    if (oldPath === newPath) continue; // KEEP + identical path -> redirect gerekmiyor

    rows.push({
      oldUrl: oldPath,
      newUrl: newPath,
      action: actionRaw.startsWith("KEEP") ? "KEEP" : "301",
      notes: notes.trim(),
    });
  }

  return rows;
}

function normalizeOldUrl(sourceUrl: string): string {
  const pathname = toPathname(sourceUrl) ?? sourceUrl;
  return pathname;
}

let _rowsCache: RedirectRow[] | null = null;
function rows(): RedirectRow[] {
  if (!_rowsCache) _rowsCache = parseRedirectMap();
  return _rowsCache;
}

/** Bir eski ürün URL'i için url-migration-map.md'de belirlenmiş kanonik slug'ı döndürür. */
export function getCanonicalProductSlug(sourceUrl: string): string | null {
  const oldPath = normalizeOldUrl(sourceUrl);
  const row = rows().find((r) => r.oldUrl === oldPath && r.newUrl.startsWith("/urun/"));
  return row ? row.newUrl.replace("/urun/", "") : null;
}

/** Bir eski kategori URL'i için kanonik slug. */
export function getCanonicalCategorySlug(sourceUrl: string): string | null {
  const oldPath = normalizeOldUrl(sourceUrl);
  const row = rows().find((r) => r.oldUrl === oldPath && r.newUrl.startsWith("/urunler/"));
  return row ? row.newUrl.replace("/urunler/", "") : null;
}

/** Bir eski blog URL'i için kanonik slug. */
export function getCanonicalBlogSlug(sourceUrl: string): string | null {
  const oldPath = normalizeOldUrl(sourceUrl);
  const row = rows().find((r) => r.oldUrl === oldPath && r.newUrl.startsWith("/blog/"));
  return row ? row.newUrl.replace("/blog/", "") : null;
}

if (require.main === module) {
  const rows = parseRedirectMap();
  console.log(`Parsed ${rows.length} redirect rows from url-migration-map.md`);
  for (const row of rows.slice(0, 5)) {
    console.log(`  ${row.oldUrl} -> ${row.newUrl} (${row.action})`);
  }
}
