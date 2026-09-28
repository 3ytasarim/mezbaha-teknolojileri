import { serveFromBucket } from "@/lib/storage/serve";

/** /images/... → özel kovadaki `images/...` nesnesi. Dosya adları anlamlı ve nadiren değişir: 30 gün önbellek. */
export async function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return serveFromBucket(request, "images", path, "public, max-age=2592000, stale-while-revalidate=86400");
}
