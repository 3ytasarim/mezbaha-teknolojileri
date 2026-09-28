import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { getBucketObject } from "@/lib/storage/s3";

/**
 * `/public` altındaki YEREL görsellerin gerçek genişlik/yükseklik/mime bilgisini dosya başlığından okur
 * (yeniden encode ETMEZ — sadece `sharp().metadata()` ile header ayrıştırır). OG image width/height/type
 * (Mecanova audit §8) ve ImageObject/primaryImageOfPage (§5) için kullanılır; uydurma ölçü YOK, sadece
 * gerçekten okunabilen dosyalar için sonuç döner, aksi halde `null` (çağıran alan opsiyonel bırakılır).
 *
 * Süreç içi bellek önbelleği: aynı yol için dosya tekrar okunmaz (statik dosyalar süreç boyunca değişmez).
 */

export type LocalImageMeta = { width: number; height: number; type: string };

const MIME_BY_FORMAT: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

const cache = new Map<string, LocalImageMeta | null>();

export async function getLocalImageMeta(publicPath: string | undefined | null): Promise<LocalImageMeta | null> {
  if (!publicPath || !publicPath.startsWith("/")) return null; // yalnızca /public altındaki yerel yollar desteklenir

  const cached = cache.get(publicPath);
  if (cached !== undefined) return cached;

  // Çoğu görsel /public altındadır; ancak icon.png / apple-icon.png gibi Next.js App Router özel
  // dosyaları fiziksel olarak src/app altında yaşar (URL'de /icon.png gibi görünse de). İkisi de denenir.
  const candidates = [join(process.cwd(), "public", publicPath), join(process.cwd(), "src", "app", publicPath)];
  let result: LocalImageMeta | null = null;

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const meta = await sharp(filePath).metadata();
      if (meta.width && meta.height && meta.format) {
        result = { width: meta.width, height: meta.height, type: MIME_BY_FORMAT[meta.format] ?? `image/${meta.format}` };
        break;
      }
    } catch {
      // sıradaki adaya geç
    }
  }

  // Yerelde yoksa (görseller kovada tutuluyorsa) kovadan okunur: /images/x.png → anahtar "images/x.png".
  if (!result && process.env.STORAGE_PROVIDER === "s3" && /^\/(images|uploads)\//.test(publicPath)) {
    try {
      const object = await getBucketObject(publicPath.slice(1));
      if (object && object !== "not-modified" && object.Body) {
        const buffer = Buffer.from(await object.Body.transformToByteArray());
        const meta = await sharp(buffer).metadata();
        if (meta.width && meta.height && meta.format) {
          result = { width: meta.width, height: meta.height, type: MIME_BY_FORMAT[meta.format] ?? `image/${meta.format}` };
        }
      }
    } catch {
      result = null;
    }
  }

  cache.set(publicPath, result);
  return result;
}
