import type { PrismaClient } from "@prisma/client";
import { parseRedirectMap } from "./parse-redirect-map";
import type { MigrationStats } from "./types";

const VALID_INTERNAL_PATHS = new Set([
  "/",
  "/urunler",
  "/projeler",
  "/blog",
  "/hakkimizda",
  "/iletisim",
  "/kataloglar",
  "/videolar",
  "/hizmetler",
]);

function isKnownDestination(destinationPath: string): boolean {
  if (VALID_INTERNAL_PATHS.has(destinationPath)) return true;
  if (destinationPath.startsWith("/urunler/")) return true;
  if (destinationPath.startsWith("/urun/")) return true;
  if (destinationPath.startsWith("/projeler/")) return true;
  if (destinationPath.startsWith("/blog/")) return true;
  if (destinationPath.startsWith("/kataloglar/")) return true;
  if (destinationPath.startsWith("/hizmetler/")) return true;
  return false;
}

export async function importRedirects(
  prisma: PrismaClient,
  dryRun: boolean,
  stats: MigrationStats
) {
  const rows = parseRedirectMap();

  for (const row of rows) {
    // Hedefte bir #fragment varsa (ör. "/hakkimizda#satis-agi") ve o bölüm henüz public
    // sayfada gerçekten yoksa, fragment'ı atıp gerçek var olan base sayfaya yönlendir —
    // hiç redirect olmamasından (404) daha iyi, ve ileride o bölüm eklenirse fragment
    // url-migration-map.md'de zaten dokümante edilmiş durumda.
    const [basePath, fragment] = row.newUrl.split("#");
    const destination = fragment && !isKnownDestination(row.newUrl) ? basePath : row.newUrl;

    if (!isKnownDestination(destination)) {
      stats.redirects.conflicts.push({
        source: row.oldUrl,
        reason: `Hedef "${row.newUrl}" bilinen bir route pattern'i değil, atlandı.`,
      });
      continue;
    }

    if (fragment && destination === basePath) {
      stats.diffs.push(
        `Redirect ${row.oldUrl}: hedef "${row.newUrl}" içindeki #${fragment} bölümü henüz public sayfada yok, "${basePath}" temel sayfasına yönlendirildi.`
      );
    }

    if (row.oldUrl === destination) continue;

    const existing = await prisma.redirect.findUnique({ where: { sourcePath: row.oldUrl } });

    if (existing) {
      if (existing.destinationPath === destination) {
        continue;
      }
      stats.redirects.updated += 1;
      stats.diffs.push(
        `Redirect ${row.oldUrl}: ${existing.destinationPath} -> ${destination} (hedef güncellendi)`
      );
      if (!dryRun) {
        await prisma.redirect.update({
          where: { sourcePath: row.oldUrl },
          data: { destinationPath: destination, statusCode: 301, active: true },
        });
      }
      continue;
    }

    stats.redirects.new += 1;
    if (!dryRun) {
      await prisma.redirect.create({
        data: {
          sourcePath: row.oldUrl,
          destinationPath: destination,
          statusCode: 301,
          active: true,
        },
      });
    }
  }
}
