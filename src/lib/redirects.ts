import "server-only";
import { prisma } from "@/lib/db";

type RedirectEntry = { destinationPath: string; statusCode: number };

const CACHE_TTL_MS = 60_000;

let cache: Map<string, RedirectEntry> | null = null;
let cacheLoadedAt = 0;
let loadingPromise: Promise<Map<string, RedirectEntry>> | null = null;

async function loadRedirects(): Promise<Map<string, RedirectEntry>> {
  const rows = await prisma.redirect.findMany({
    where: { active: true },
    select: { sourcePath: true, destinationPath: true, statusCode: true },
  });

  const map = new Map<string, RedirectEntry>();
  for (const row of rows) {
    map.set(normalizePath(row.sourcePath), {
      destinationPath: row.destinationPath,
      statusCode: row.statusCode,
    });
  }

  return map;
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export async function findRedirect(pathname: string): Promise<RedirectEntry | null> {
  const isStale = !cache || Date.now() - cacheLoadedAt > CACHE_TTL_MS;

  if (isStale) {
    if (!loadingPromise) {
      loadingPromise = loadRedirects().finally(() => {
        loadingPromise = null;
      });
    }

    try {
      cache = await loadingPromise;
      cacheLoadedAt = Date.now();
    } catch {
      if (!cache) return null;
    }
  }

  return cache?.get(normalizePath(pathname)) ?? null;
}
