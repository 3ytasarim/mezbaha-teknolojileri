import { serveFromBucket } from "@/lib/storage/serve";

/** /uploads/... → özel kovadaki `uploads/...` nesnesi. Dosya adlarında rastgele ek olduğundan değişmez: 1 yıl önbellek. */
export async function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return serveFromBucket(request, "uploads", path, "public, max-age=31536000, immutable");
}
