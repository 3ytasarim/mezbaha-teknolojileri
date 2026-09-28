/**
 * Yönetim panelinden yüklenen dosyaların adresi mutlak kaydedilmişti (ör. http://localhost:3000/uploads/x.png); bu, farklı
 * port/alan adında (localhost:3700, www/apex) next/image tarafından reddedilir. Bu betik, veritabanındaki tüm metin
 * sütunlarında `http(s)://<host>/uploads/…` biçimini göreli `/uploads/…` biçimine çevirir. İdempotent.
 * Kullanım: npx tsx prisma/migration/fix-upload-urls.ts [--dry-run]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DRY = process.argv.includes("--dry-run");
const PATTERN = 'https?://[^/[:space:]"]+/uploads/';
const PATTERN_SQL = `'${PATTERN}'`;

async function main() {
  const cols = await prisma.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(
    `select table_name, column_name from information_schema.columns
     where table_schema = 'public' and data_type in ('text','character varying') and table_name <> '_prisma_migrations' and column_name <> 'sourceUrl'`
  );
  let total = 0;
  for (const { table_name, column_name } of cols) {
    const t = `"${table_name}"`;
    const c = `"${column_name}"`;
    const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`select count(*) as n from ${t} where ${c} ~ ${PATTERN_SQL}`);
    const n = Number(rows[0].n);
    if (!n) continue;
    total += n;
    console.log(`${DRY ? "[dry-run] " : ""}${table_name}.${column_name}: ${n} satır`);
    if (!DRY) await prisma.$executeRawUnsafe(`update ${t} set ${c} = regexp_replace(${c}, ${PATTERN_SQL}, '/uploads/', 'g') where ${c} ~ ${PATTERN_SQL}`);
  }
  console.log(`${DRY ? "[dry-run] " : ""}toplam ${total} satır ${DRY ? "etkilenecek" : "güncellendi"}.`);
}

main().finally(() => prisma.$disconnect());
