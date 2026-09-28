import "server-only";
import { getBucketObject } from "./s3";

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|avif|svg|pdf)$/i;

/**
 * /images/... ve /uploads/... isteklerini özel kovadan sunar. Yol, kova anahtarına birebir eşlenir
 * (`images/migrated/...`, `uploads/<dosya>`). Yalnızca görsel/PDF uzantıları ve `..` içermeyen yollar kabul edilir.
 * Yerel geliştirmede (STORAGE_PROVIDER=local) dosyalar zaten /public'ten sunulur; bu durumda 404 döner.
 */
export async function serveFromBucket(request: Request, prefix: "images" | "uploads", segments: string[], cacheControl: string) {
  if (process.env.STORAGE_PROVIDER !== "s3") return new Response("Not found", { status: 404 });

  const decoded = segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return "";
    }
  });
  if (decoded.length === 0 || decoded.some((s) => !s || s === "." || s === ".." || s.includes("/") || s.includes("\\") || s.includes("\0"))) {
    return new Response("Not found", { status: 404 });
  }
  const key = `${prefix}/${decoded.join("/")}`;
  if (!ALLOWED_EXT.test(key)) return new Response("Not found", { status: 404 });

  const result = await getBucketObject(key, request.headers.get("if-none-match")).catch(() => "error" as const);
  if (result === "error") return new Response("Storage error", { status: 502 });
  if (result === null) return new Response("Not found", { status: 404 });

  if (result === "not-modified") {
    return new Response(null, { status: 304, headers: { "Cache-Control": cacheControl } });
  }

  const body = result.Body?.transformToWebStream();
  if (!body) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": result.ContentType ?? "application/octet-stream",
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
  });
  if (result.ContentLength != null) headers.set("Content-Length", String(result.ContentLength));
  if (result.ETag) headers.set("ETag", result.ETag);
  if (result.LastModified) headers.set("Last-Modified", result.LastModified.toUTCString());
  // Kullanıcı yüklemesi olabilecek SVG/PDF gibi içeriklerde betik çalıştırmayı engelle.
  headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");

  return new Response(body, { status: 200, headers });
}
