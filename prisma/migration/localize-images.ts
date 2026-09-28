/**
 * Phase 11C: blog gövdelerindeki <img src="https://mezbahateknolojileri.com/uploads/..."> hotlink'lerini
 * yerel kopyalara çevirir (kaynak URL -> localPath eşlemesi migration verisinden gelir) ve
 * gerçek piksel boyutlarını width/height olarak ekler (CLS / unsized-images).
 * Yerel dosya yoksa img OLDUĞU GİBİ bırakılır ve raporlanır (sessizce silinmez).
 */
import { existsSync, readFileSync } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..", "..");
const DATA_FILES = ["blog-posts-batch1.json", "blog-posts-batch2.json"];

export function loadImageMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of DATA_FILES) {
    const file = path.join(ROOT, "docs", "migration-data", f);
    if (!existsSync(file)) continue;
    const posts = JSON.parse(readFileSync(file, "utf-8")).posts as {
      localCoverImage?: { sourceUrl: string; localPath?: string } | null;
      localInlineImages?: { sourceUrl: string; localPath?: string }[];
    }[];
    for (const p of posts) {
      for (const i of [...(p.localInlineImages ?? []), ...(p.localCoverImage ? [p.localCoverImage] : [])]) {
        if (i.sourceUrl && i.localPath) map.set(i.sourceUrl, i.localPath);
      }
    }
  }
  return map;
}

function toDisk(localPath: string): string {
  return path.join(ROOT, localPath.startsWith("public/") ? localPath : path.join("public", localPath));
}

function toWebPath(localPath: string): string {
  const p = localPath.replace(/^public\//, "");
  return p.startsWith("/") ? p : "/" + p;
}

export async function localizeBodyImages(
  html: string,
  map: Map<string, string>
): Promise<{ html: string; replaced: number; missing: string[] }> {
  const missing: string[] = [];
  let replaced = 0;
  const tags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  let out = html;

  for (const tag of tags) {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!src || !/^https?:\/\//.test(src)) continue;
    const local = map.get(src);
    if (!local || !existsSync(toDisk(local))) {
      missing.push(src);
      continue;
    }
    const meta = await sharp(toDisk(local)).metadata();
    const alt = tag.match(/\balt="([^"]*)"/)?.[1] ?? "";
    const next =
      '<img src="' + toWebPath(local) + '" alt="' + alt + '"' +
      (meta.width && meta.height ? ' width="' + meta.width + '" height="' + meta.height + '"' : "") +
      ' loading="lazy">';
    out = out.replace(tag, next);
    replaced++;
  }
  return { html: out, replaced, missing };
}
