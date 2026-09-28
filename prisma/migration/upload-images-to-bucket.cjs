/**
 * public/images (raster) ve public/uploads içindeki tüm görselleri S3 uyumlu kovaya yükler.
 * Anahtarlar URL yoluyla birebir aynıdır: public/images/a/b.png → "images/a/b.png", public/uploads/x.png → "uploads/x.png".
 * Böylece sitedeki /images/... ve /uploads/... adresleri (DB, sitemap, canonical, 301'ler) hiç değişmez.
 * SVG'ler (logo, ikon, harita) arayüz varlığı olduğu için public/ içinde kalır.
 *
 * Idempotent: kovada aynı boyutta nesne varsa atlanır. Silme YAPMAZ.
 * Kullanım: node prisma/migration/upload-images-to-bucket.cjs [--apply] [--verify]
 */
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const PUBLIC = path.join(process.cwd(), "public");
const RASTER = /\.(jpe?g|png|webp|gif|avif)$/i;
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

const client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION,
  credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY, secretAccessKey: process.env.STORAGE_SECRET_KEY },
  forcePathStyle: true,
});
const Bucket = process.env.STORAGE_BUCKET;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function collect() {
  const files = [];
  for (const root of ["images", "uploads"]) {
    const dir = path.join(PUBLIC, root);
    if (!fs.existsSync(dir)) continue;
    for (const full of walk(dir)) {
      if (!RASTER.test(full)) continue;
      const key = path.relative(PUBLIC, full).split(path.sep).join("/");
      files.push({ full, key, size: fs.statSync(full).size });
    }
  }
  return files;
}

async function headSize(key) {
  try {
    const h = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
    return h.ContentLength;
  } catch {
    return null;
  }
}

async function pool(items, limit, worker) {
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await worker(item);
      }
    })
  );
}

async function listAll() {
  const keys = new Map();
  let token;
  do {
    const r = await client.send(new ListObjectsV2Command({ Bucket, ContinuationToken: token }));
    for (const o of r.Contents ?? []) keys.set(o.Key, o.Size);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function main() {
  const files = collect();
  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  console.log(`Yerelde yüklenecek görsel: ${files.length} dosya, ${(totalBytes / 1048576).toFixed(1)} MB`);

  if (VERIFY) {
    const remote = await listAll();
    let missing = 0, mismatched = 0;
    for (const f of files) {
      const size = remote.get(f.key);
      if (size === undefined) missing++;
      else if (size !== f.size) mismatched++;
    }
    console.log(`Kovadaki nesne: ${remote.size} | eksik: ${missing} | boyutu farklı: ${mismatched}`);
    process.exit(missing || mismatched ? 1 : 0);
  }

  if (!APPLY) {
    console.log("Kuru çalıştırma. Yüklemek için --apply");
    return;
  }

  let uploaded = 0, skipped = 0, failed = 0;
  await pool(files, 8, async (f) => {
    try {
      if ((await headSize(f.key)) === f.size) { skipped++; return; }
      const ext = path.extname(f.full).slice(1).toLowerCase();
      await client.send(new PutObjectCommand({
        Bucket,
        Key: f.key,
        Body: fs.readFileSync(f.full),
        ContentType: MIME[ext] ?? "application/octet-stream",
        CacheControl: f.key.startsWith("uploads/") ? "public, max-age=31536000, immutable" : "public, max-age=2592000",
      }));
      uploaded++;
      if (uploaded % 50 === 0) console.log(`  ... ${uploaded} yüklendi`);
    } catch (e) {
      failed++;
      console.error("HATA", f.key, e.message);
    }
  });
  console.log(`Bitti. Yüklenen: ${uploaded} | zaten vardı: ${skipped} | hata: ${failed}`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
