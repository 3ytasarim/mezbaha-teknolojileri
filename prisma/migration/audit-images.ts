/** Phase 11C: >500 KB orijinal görsel denetimi (salt-okunur; hiçbir dosyayı değiştirmez). */
import { readdirSync, statSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.join(__dirname, "..", "..");
const BASE = process.env.VALIDATE_BASE_URL ?? "http://localhost:3700";

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

async function delivered(rel: string, w: number) {
  const url = `${BASE}/_next/image?url=${encodeURIComponent("/" + rel)}&w=${w}&q=75`;
  const r = await fetch(url, { headers: { Accept: "image/avif,image/webp,image/*" } });
  const buf = Buffer.from(await r.arrayBuffer());
  return { status: r.status, bytes: buf.length, type: r.headers.get("content-type") ?? "?" };
}

async function main() {
  const files = walk(path.join(ROOT, "public", "images")).filter((f) => statSync(f).size > 500 * 1024);
  const rows: Record<string, unknown>[] = [];
  for (const f of files.sort()) {
    const rel = path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/");
    const size = statSync(f).size;
    const meta = await sharp(f).metadata();
    const d640 = await delivered(rel, 640);
    const d1200 = await delivered(rel, 1200);
    const d1920 = await delivered(rel, 1920);
    rows.push({ rel, kb: Math.round(size / 1024), w: meta.width, h: meta.height, fmt: meta.format, d640: d640.bytes, d1200: d1200.bytes, d1920: d1920.bytes, type: d1200.type, ok: d640.status === 200 && d1200.status === 200 });
  }
  const totalKb = rows.reduce((a, r) => a + (r.kb as number), 0);
  const md = [
    "# Image Optimization Audit (Phase 11C)", "",
    "Salt-okunur denetim: orijinaller DEĞİŞTİRİLMEDİ. Teslimat ölçümü `next start` üzerinde `/_next/image` (q=75, Accept: avif/webp) ile yapıldı.", "",
    `- >500 KB orijinal: **${rows.length}** dosya, toplam **${(totalKb / 1024).toFixed(1)} MB**`,
    `- /_next/image başarısız: ${rows.filter((r) => !r.ok).length}`,
    `- Teslim biçimi: ${[...new Set(rows.map((r) => r.type))].join(", ")}`,
    `- Ortalama teslimat @640w: ${(rows.reduce((a, r) => a + (r.d640 as number), 0) / rows.length / 1024).toFixed(0)} KB, @1200w: ${(rows.reduce((a, r) => a + (r.d1200 as number), 0) / rows.length / 1024).toFixed(0)} KB`,
    "", "| Dosya | Boyut (KB) | Piksel | Biçim | @640 KB | @1200 KB | @1920 KB |", "|---|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.rel} | ${r.kb} | ${r.w}×${r.h} | ${r.fmt} | ${Math.round((r.d640 as number) / 1024)} | ${Math.round((r.d1200 as number) / 1024)} | ${Math.round((r.d1920 as number) / 1024)} |`),
  ].join("\n");
  writeFileSync(path.join(ROOT, "docs", "image-optimization-audit.md"), md, "utf-8");
  const dims = rows.map((r) => `${r.w}x${r.h}`);
  console.log(JSON.stringify({ n: rows.length, totalMB: +(totalKb / 1024).toFixed(1), failed: rows.filter((r) => !r.ok).length, types: [...new Set(rows.map((r) => r.type))], avg640KB: Math.round(rows.reduce((a, r) => a + (r.d640 as number), 0) / rows.length / 1024), avg1200KB: Math.round(rows.reduce((a, r) => a + (r.d1200 as number), 0) / rows.length / 1024), maxDim: dims.sort()[dims.length - 1], byFolder: Object.entries(rows.reduce((a: Record<string, number>, r) => { const k = (r.rel as string).split("/").slice(0, 3).join("/"); a[k] = (a[k] || 0) + 1; return a; }, {})).slice(0, 8) }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
