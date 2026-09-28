import { createHash } from "crypto";

export type SourceImage = {
  sourceUrl: string;
  localPath?: string;
  alt?: string | null;
};

export type EntityStats = {
  new: number;
  updated: number;
  skipped: number;
  errors: { source: string; reason: string }[];
};

export function newStats(): EntityStats {
  return { new: 0, updated: 0, skipped: 0, errors: [] };
}

export type MigrationStats = {
  categories: EntityStats;
  products: EntityStats;
  projects: EntityStats;
  blogPosts: EntityStats;
  media: { downloaded: number; reused: number; failed: number };
  redirects: { new: number; updated: number; conflicts: { source: string; reason: string }[] };
  diffs: string[];
  provenance: ProvenanceRecord[];
};

export function newMigrationStats(): MigrationStats {
  return {
    categories: newStats(),
    products: newStats(),
    projects: newStats(),
    blogPosts: newStats(),
    media: { downloaded: 0, reused: 0, failed: 0 },
    redirects: { new: 0, updated: 0, conflicts: [] },
    diffs: [],
    provenance: [],
  };
}

export type ProvenanceRecord = {
  entityType: "category" | "product" | "project" | "blogPost";
  entityId: string | null;
  slug: string;
  sourceUrl: string;
  /** Kaynak kaydın (çıkarılan JSON girdisinin) SHA-256 özeti. */
  sourceHash: string;
  importedAt: string;
};

export function hashSource(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
