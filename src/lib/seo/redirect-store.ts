import "server-only";
import { prisma } from "@/lib/db";
import sitemap from "@/app/sitemap";
import { normalizePath } from "@/lib/seo/redirect-guard";
import type { CanonicalProvider, RedirectStore } from "@/lib/seo/redirect-service";

/** Prisma/Postgres uygulaması: tüm doğrulama+yazma tek işlemde, advisory lock altında (eşzamanlı yöneticiler sıraya girer). */
export const prismaRedirectStore: RedirectStore = {
  withLock: (fn) =>
    prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('mezbaha-redirect-admin'))`;
        return fn({
          listAll: async () => (await tx.redirect.findMany({ select: { id: true, sourcePath: true, destinationPath: true, statusCode: true, active: true } })),
          create: (input) => tx.redirect.create({ data: input, select: { id: true, sourcePath: true, destinationPath: true, statusCode: true, active: true } }),
          update: async (id, patch) => {
            await tx.redirect.update({ where: { id }, data: patch });
          },
        });
      },
      { maxWait: 10_000, timeout: 30_000 },
    ),
};

/** Sitemap = sitenin indekslenebilir canonical adresleri. Üretilemezse null (çağıran taraf fail-closed davranır). */
export const sitemapCanonicalPaths: CanonicalProvider = async () => {
  const entries = await sitemap();
  if (!entries.length) return null;
  return new Set(entries.map((e) => normalizePath(new URL(e.url).pathname)));
};
