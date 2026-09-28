import "server-only";
import { prisma } from "@/lib/db";
import { LOCALES, CANONICAL_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Yönetim panelinde "Çeviriler": her içerik türü için çeviri tablosu uyarlayıcısı. Genel alan adları (title, short, body,
 * applications, features, seoTitle, seoDescription) türe göre gerçek sütunlara eşlenir.
 */
export type TranslationKind = "urun" | "kategori" | "proje" | "blog" | "sayfa";
export const TRANSLATION_KINDS: TranslationKind[] = ["urun", "kategori", "proje", "blog", "sayfa"];
export const TARGET_LOCALES: Locale[] = LOCALES.filter((l) => l !== CANONICAL_LOCALE);

export type FieldKey = "title" | "slug" | "short" | "body" | "applications" | "features" | "seoTitle" | "seoDescription";
export type TranslationValues = Partial<Record<FieldKey, string>>;

type Cols = { title: string; short?: string; body?: string; applications?: string; features?: string };

type Cfg = {
  label: string;
  plural: string;
  fk: string;
  uniqueKey: string;
  cols: Cols;
  htmlFields: FieldKey[];
  publicPrefix: string;
  titleLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities: () => any;
};

const CFG: Record<TranslationKind, Cfg> = {
  urun: {
    label: "Ürün", plural: "Ürünler", fk: "productId", uniqueKey: "productId_locale", publicPrefix: "/urun", titleLabel: "Ürün adı",
    cols: { title: "name", short: "shortDescription", body: "description", applications: "applications", features: "features" },
    htmlFields: ["body", "applications", "features"],
    translations: () => prisma.productTranslation, entities: () => prisma.product,
  },
  kategori: {
    label: "Kategori", plural: "Kategoriler", fk: "categoryId", uniqueKey: "categoryId_locale", publicPrefix: "/urunler", titleLabel: "Kategori adı",
    cols: { title: "name", short: "shortDescription", body: "description" },
    htmlFields: [],
    translations: () => prisma.productCategoryTranslation, entities: () => prisma.productCategory,
  },
  proje: {
    label: "Proje", plural: "Projeler", fk: "projectId", uniqueKey: "projectId_locale", publicPrefix: "/projeler", titleLabel: "Proje adı",
    cols: { title: "name", short: "shortDescription", body: "description" },
    htmlFields: [],
    translations: () => prisma.projectTranslation, entities: () => prisma.project,
  },
  blog: {
    label: "Blog yazısı", plural: "Blog yazıları", fk: "blogPostId", uniqueKey: "blogPostId_locale", publicPrefix: "/blog", titleLabel: "Başlık",
    cols: { title: "title", short: "excerpt", body: "content" },
    htmlFields: ["body"],
    translations: () => prisma.blogPostTranslation, entities: () => prisma.blogPost,
  },
  sayfa: {
    label: "Hizmet sayfası", plural: "Hizmet sayfaları", fk: "pageId", uniqueKey: "pageId_locale", publicPrefix: "/hizmetler", titleLabel: "Başlık",
    cols: { title: "title", body: "content" },
    htmlFields: ["body"],
    translations: () => prisma.pageTranslation, entities: () => prisma.page,
  },
};

export const isKind = (v: string): v is TranslationKind => (TRANSLATION_KINDS as string[]).includes(v);
export const kindLabel = (k: TranslationKind) => CFG[k].label;
export const kindPlural = (k: TranslationKind) => CFG[k].plural;
export const kindTitleLabel = (k: TranslationKind) => CFG[k].titleLabel;
export const kindHtmlFields = (k: TranslationKind) => CFG[k].htmlFields;
export const kindHasField = (k: TranslationKind, f: FieldKey) => {
  if (f === "title" || f === "slug" || f === "seoTitle" || f === "seoDescription") return true;
  return Boolean(CFG[k].cols[f as keyof Cols]);
};
export const kindPublicPath = (k: TranslationKind, slug: string) => `${CFG[k].publicPrefix}/${slug}`;

const toValues = (kind: TranslationKind, row: Record<string, string | null> | undefined): TranslationValues => {
  if (!row) return {};
  const c = CFG[kind].cols;
  return {
    title: row[c.title] ?? "",
    slug: row.slug ?? "",
    short: c.short ? (row[c.short] ?? "") : undefined,
    body: c.body ? (row[c.body] ?? "") : undefined,
    applications: c.applications ? (row[c.applications] ?? "") : undefined,
    features: c.features ? (row[c.features] ?? "") : undefined,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
};

export type CoverageRow = { id: string; slug: string; title: string; locales: Partial<Record<Locale, string | null>> };

/** Kapsam tablosu: her varlık için hangi dillerde çeviri (ve slug) var. */
export async function listCoverage(kind: TranslationKind): Promise<CoverageRow[]> {
  const cfg = CFG[kind];
  const rows = await cfg.entities().findMany({ select: { id: true, slug: true, translations: { select: { locale: true, slug: true, [cfg.cols.title]: true } } }, orderBy: { createdAt: "asc" } });
  return rows.map((r: { id: string; slug: string; translations: Record<string, string | null>[] }) => {
    const tr = r.translations.find((t) => t.locale === CANONICAL_LOCALE);
    const locales: CoverageRow["locales"] = {};
    for (const t of r.translations) locales[t.locale as Locale] = t.slug ?? "";
    return { id: r.id, slug: r.slug, title: (tr?.[cfg.cols.title] as string) ?? r.slug, locales };
  });
}

export type TranslationDoc = { id: string; slug: string; reference: TranslationValues; byLocale: Partial<Record<Locale, TranslationValues>> };

export async function getTranslationDoc(kind: TranslationKind, id: string): Promise<TranslationDoc | null> {
  const cfg = CFG[kind];
  const row = await cfg.entities().findUnique({ where: { id }, select: { id: true, slug: true, translations: true } });
  if (!row) return null;
  const byLocale: TranslationDoc["byLocale"] = {};
  let reference: TranslationValues = {};
  for (const t of row.translations as Record<string, string | null>[]) {
    if (t.locale === CANONICAL_LOCALE) reference = { ...toValues(kind, t), slug: row.slug };
    else byLocale[t.locale as Locale] = toValues(kind, t);
  }
  return { id: row.id, slug: row.slug, reference, byLocale };
}

export async function slugTaken(kind: TranslationKind, id: string, locale: Locale, slug: string): Promise<boolean> {
  const cfg = CFG[kind];
  const found = await cfg.translations().findFirst({ where: { locale, slug, NOT: { [cfg.fk]: id } }, select: { id: true } });
  return Boolean(found);
}

export async function saveTranslation(kind: TranslationKind, id: string, locale: Locale, v: Required<Pick<TranslationValues, "title" | "slug">> & TranslationValues) {
  const cfg = CFG[kind];
  const data: Record<string, string | null> = { [cfg.cols.title]: v.title, slug: v.slug, seoTitle: v.seoTitle || null, seoDescription: v.seoDescription || null };
  if (cfg.cols.short) data[cfg.cols.short] = v.short || null;
  if (cfg.cols.body) data[cfg.cols.body] = v.body || null;
  if (cfg.cols.applications) data[cfg.cols.applications] = v.applications || null;
  if (cfg.cols.features) data[cfg.cols.features] = v.features || null;
  await cfg.translations().upsert({
    where: { [cfg.uniqueKey]: { [cfg.fk]: id, locale } },
    create: { [cfg.fk]: id, locale, ...data },
    update: data,
  });
}

export async function removeTranslation(kind: TranslationKind, id: string, locale: Locale) {
  const cfg = CFG[kind];
  await cfg.translations().deleteMany({ where: { [cfg.fk]: id, locale } });
}
