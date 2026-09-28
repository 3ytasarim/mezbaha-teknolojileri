/**
 * Eski sitenin /tr/projeler/ sayfasındaki 7 kapasite paketi projesinin (C-50 … C-300) galerileri: her pakette 4 görsel
 * (iç görünüş, dış görünüş dizaynı, iç fotoğraf, makina yerleşim planı) + açıklamaları + 1 YouTube videosu.
 *
 * Yalnızca EKSİK veriyi tamamlar (idempotent): galerisi olan projeye dokunmaz; videoUrl doluysa değiştirmez.
 * Görseller public/images/migrated/projects/<slug>/ altına SEO dostu adlarla indirilir; ProjectImage (alt + açıklama)
 * ve Project.videoUrl yazılır. Kaynak kaydı: docs/capacity-galleries-provenance.json.
 * Kullanım: npx tsx prisma/migration/acquire-capacity-galleries.ts [--dry-run]
 */
import "dotenv/config";
import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ROOT = path.join(__dirname, "..", "..");
const ORIGIN = "https://www.mezbahateknolojileri.com";
const PAGE = ORIGIN + "/tr/projeler/";
const UA = "MezbahaMigrationBot/1.0 (+content migration)";
const DRY = process.argv.includes("--dry-run");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Eski sitedeki başlık → veritabanındaki proje slug'ı
const SLUGS: [RegExp, string][] = [
  [/^C-?50 KÜÇÜK/i, "c-50"],
  [/^C-?50 ?-? ?PLUS/i, "c-50-plus"],
  [/^C-?100 ?-? ?PLUS/i, "c-100-plus"],
  [/^C-?100 ?-? ?XL/i, "c-100-xl"],
  [/^C-?100/i, "c-100"],
  [/^C-?200/i, "c-200"],
  [/^C-?300/i, "c-300"],
];

function kindOf(caption: string, index: number): string {
  const c = caption.toLocaleLowerCase("tr");
  if (/fotoğraf/.test(c)) return "ic-fotograf";
  if (/dış/.test(c)) return "dis-gorunum";
  if (/plan/.test(c)) return "yerlesim-plani";
  if (/iç görünüş/.test(c)) return "ic-gorunum";
  return `gorsel-${index + 1}`;
}

const tidy = (s: string) => s.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").replace(/\.$/, "").replace(/\bm2\b/g, "m²").trim();

function sniffExt(b: Buffer): string | null {
  if (b.length > 12 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") return "webp";
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  return null;
}

async function fetchBuf(url: string): Promise<Buffer> {
  let last: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      last = new Error("HTTP " + r.status + " " + url);
    } catch (e) {
      last = e;
    }
    await sleep(600 * 2 ** i);
  }
  throw last;
}

async function main() {
  const html = (await fetchBuf(PAGE)).toString("utf8");
  const blocks = html.split('<div class="project-layout-title">').slice(1);
  console.log("kaynak sayfada paket bloğu:", blocks.length);

  const prov: unknown[] = [];

  for (const block of blocks) {
    const title = (block.match(/<h2 class="title">([^<]*)</) || [])[1]?.trim() ?? "";
    const slug = SLUGS.find(([re]) => re.test(title))?.[1];
    const images = [...block.matchAll(/<a href="([^"]+)" class="box">[\s\S]*?<p>\s*([\s\S]*?)\s*<\/p>/g)].map((m) => ({ src: m[1], caption: tidy(m[2]) }));
    const video = block.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)?.[1];

    if (!slug) {
      console.log("EŞLEŞMEDİ:", title);
      continue;
    }
    const project = await prisma.project.findUnique({ where: { slug }, include: { images: { select: { id: true } } } });
    if (!project) {
      console.log("projede kayıt yok:", slug);
      continue;
    }

    console.log(`\n${slug} ← "${title}" | ${images.length} görsel | video ${video ?? "yok"} | mevcut galeri ${project.images.length}`);

    if (project.images.length === 0) {
      const dir = path.join(ROOT, "public", "images", "migrated", "projects", slug);
      if (!DRY) mkdirSync(dir, { recursive: true });
      for (let i = 0; i < images.length; i++) {
        const { src, caption } = images[i];
        const url = ORIGIN + src;
        if (DRY) {
          console.log("  [dry-run]", url, "|", caption);
          continue;
        }
        const buf = await fetchBuf(url);
        const ext = sniffExt(buf);
        if (!ext) throw new Error("Bilinmeyen görsel biçimi: " + url);
        const file = `${slug}-${kindOf(caption, i)}.${ext}`;
        writeFileSync(path.join(dir, file), buf);
        const meta = await sharp(buf).metadata();
        const local = `/images/migrated/projects/${slug}/${file}`;
        await prisma.projectImage.create({
          data: { projectId: project.id, imageUrl: local, alt: caption, caption, width: meta.width ?? null, height: meta.height ?? null, sortOrder: i },
        });
        prov.push({ slug, sourceUrl: url, local, sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length, caption });
        console.log("  ✓", local, `${meta.width}x${meta.height}`);
        await sleep(400);
      }
    }

    if (video && !project.videoUrl) {
      if (!DRY) await prisma.project.update({ where: { id: project.id }, data: { videoUrl: `https://www.youtube.com/watch?v=${video}` } });
      console.log("  ✓ videoUrl:", video);
    }
  }

  if (!DRY && prov.length) {
    writeFileSync(path.join(ROOT, "docs", "capacity-galleries-provenance.json"), JSON.stringify({ source: PAGE, fetchedAt: new Date().toISOString(), images: prov }, null, 2));
  }
  console.log(DRY ? "\n[dry-run] tamam." : "\ntamam.");
}

main().finally(() => prisma.$disconnect());
