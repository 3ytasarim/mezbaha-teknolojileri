"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { slugify, isReservedSlug } from "@/lib/slug";
import { sanitizeContentHtml } from "@/lib/sanitize";
import type { ContentStatus } from "@prisma/client";

const galleryItemSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional().default(""),
  caption: z.string().optional().default(""),
});

const specItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const documentItemSchema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
});

const productSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı."),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı."),
  categoryId: z.string().min(1, "Kategori seçin."),
  sku: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  applications: z.string().optional(),
  features: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  coverImage: z.string().optional(),
  coverImageAlt: z.string().trim().max(160).optional(),
  videoUrl: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
});

export type ProductFormState = {
  error?: string;
};

function parseJson<T>(raw: FormDataEntryValue | null, schema: z.ZodType<T>): T[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => schema.safeParse(item))
      .filter((r): r is { success: true; data: T } => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}

function parseForm(formData: FormData) {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  const parsed = productSchema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    categoryId: formData.get("categoryId"),
    sku: formData.get("sku") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    applications: formData.get("applications") || undefined,
    features: formData.get("features") || undefined,
    status: formData.get("status") || "DRAFT",
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder") || 0,
    coverImage: formData.get("coverImage") || undefined,
    coverImageAlt: formData.get("coverImageAlt") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    canonicalUrl: formData.get("canonicalUrl") || undefined,
    ogImage: formData.get("ogImage") || undefined,
  });

  const gallery = parseJson(formData.get("gallery"), galleryItemSchema);
  const specifications = parseJson(formData.get("specifications"), specItemSchema);
  const documents = parseJson(formData.get("documents"), documentItemSchema);
  const relatedProjectIds = formData.getAll("relatedProjectIds").map(String);
  const relatedPostIds = formData.getAll("relatedPostIds").map(String);

  return { parsed, gallery, specifications, documents, relatedProjectIds, relatedPostIds };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin("EDITOR");

  const { parsed, gallery, specifications, documents, relatedProjectIds, relatedPostIds } =
    parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const { name, slug, categoryId, status, ...rest } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  }

  const [slugExists, category] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.productCategory.findUnique({ where: { id: categoryId } }),
  ]);

  if (slugExists) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };
  if (!category) return { error: "Seçilen kategori bulunamadı." };

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug,
        categoryId,
        sku: rest.sku,
        coverImage: rest.coverImage,
        coverImageAlt: rest.coverImage ? rest.coverImageAlt : null,
        videoUrl: rest.videoUrl,
        sortOrder: rest.sortOrder,
        featured: rest.featured,
        active: rest.active,
        status: status as ContentStatus,
        relatedProjects: { connect: relatedProjectIds.map((id) => ({ id })) },
        relatedPosts: { connect: relatedPostIds.map((id) => ({ id })) },
      },
    });

    await tx.productTranslation.create({
      data: {
        productId: created.id,
        locale: "tr",
        name,
        shortDescription: rest.shortDescription,
        description: rest.description ? sanitizeContentHtml(rest.description) : undefined,
        applications: rest.applications ? sanitizeContentHtml(rest.applications) : undefined,
        features: rest.features ? sanitizeContentHtml(rest.features) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        canonicalUrl: rest.canonicalUrl,
        ogImage: rest.ogImage,
      },
    });

    if (gallery.length > 0) {
      await tx.productImage.createMany({
        data: gallery.map((item, index) => ({
          productId: created.id,
          imageUrl: item.url,
          alt: item.alt,
          caption: item.caption,
          sortOrder: index,
        })),
      });
    }

    if (specifications.length > 0) {
      await tx.productSpecification.createMany({
        data: specifications.map((item, index) => ({
          productId: created.id,
          locale: "tr",
          label: item.label,
          value: item.value,
          sortOrder: index,
        })),
      });
    }

    if (documents.length > 0) {
      await tx.productDocument.createMany({
        data: documents.map((item, index) => ({
          productId: created.id,
          title: item.title,
          fileUrl: item.fileUrl,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          sortOrder: index,
        })),
      });
    }

    return created;
  });

  revalidateProductPaths(slug, category.slug);
  redirect(`/admin/urunler/${product.id}`);
}

export async function updateProductAction(
  id: string,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin("EDITOR");

  const { parsed, gallery, specifications, documents, relatedProjectIds, relatedPostIds } =
    parseForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const { name, slug, categoryId, status, ...rest } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  }

  const [slugOwner, category, existing] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.productCategory.findUnique({ where: { id: categoryId } }),
    prisma.product.findUnique({ where: { id }, select: { slug: true, category: { select: { slug: true } } } }),
  ]);

  if (slugOwner && slugOwner.id !== id) {
    return { error: `"${slug}" slug'ı zaten kullanılıyor.` };
  }
  if (!category) return { error: "Seçilen kategori bulunamadı." };
  if (!existing) return { error: "Ürün bulunamadı." };

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        slug,
        categoryId,
        sku: rest.sku,
        coverImage: rest.coverImage,
        coverImageAlt: rest.coverImage ? rest.coverImageAlt : null,
        videoUrl: rest.videoUrl,
        sortOrder: rest.sortOrder,
        featured: rest.featured,
        active: rest.active,
        status: status as ContentStatus,
        relatedProjects: { set: relatedProjectIds.map((rid) => ({ id: rid })) },
        relatedPosts: { set: relatedPostIds.map((rid) => ({ id: rid })) },
      },
    });

    await tx.productTranslation.upsert({
      where: { productId_locale: { productId: id, locale: "tr" } },
      create: {
        productId: id,
        locale: "tr",
        name,
        shortDescription: rest.shortDescription,
        description: rest.description ? sanitizeContentHtml(rest.description) : undefined,
        applications: rest.applications ? sanitizeContentHtml(rest.applications) : undefined,
        features: rest.features ? sanitizeContentHtml(rest.features) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        canonicalUrl: rest.canonicalUrl,
        ogImage: rest.ogImage,
      },
      update: {
        name,
        shortDescription: rest.shortDescription,
        description: rest.description ? sanitizeContentHtml(rest.description) : undefined,
        applications: rest.applications ? sanitizeContentHtml(rest.applications) : undefined,
        features: rest.features ? sanitizeContentHtml(rest.features) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        canonicalUrl: rest.canonicalUrl,
        ogImage: rest.ogImage,
      },
    });

    await tx.productImage.deleteMany({ where: { productId: id } });
    if (gallery.length > 0) {
      await tx.productImage.createMany({
        data: gallery.map((item, index) => ({
          productId: id,
          imageUrl: item.url,
          alt: item.alt,
          caption: item.caption,
          sortOrder: index,
        })),
      });
    }

    await tx.productSpecification.deleteMany({ where: { productId: id } });
    if (specifications.length > 0) {
      await tx.productSpecification.createMany({
        data: specifications.map((item, index) => ({
          productId: id,
          locale: "tr",
          label: item.label,
          value: item.value,
          sortOrder: index,
        })),
      });
    }

    await tx.productDocument.deleteMany({ where: { productId: id } });
    if (documents.length > 0) {
      await tx.productDocument.createMany({
        data: documents.map((item, index) => ({
          productId: id,
          title: item.title,
          fileUrl: item.fileUrl,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          sortOrder: index,
        })),
      });
    }
  });

  revalidateProductPaths(slug, category.slug);
  if (existing.slug !== slug) revalidatePath(`/urun/${existing.slug}`);
  revalidatePath(`/admin/urunler/${id}`);

  return {};
}

export async function deleteProductAction(id: string) {
  await requireAdmin("ADMIN");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, category: { select: { slug: true } } },
  });
  if (!product) return;

  await prisma.product.delete({ where: { id } });

  revalidateProductPaths(product.slug, product.category.slug);
}

function revalidateProductPaths(slug: string, categorySlug: string) {
  revalidatePath("/admin/urunler");
  revalidatePath(`/urun/${slug}`);
  revalidatePath("/urunler");
  revalidatePath(`/urunler/${categorySlug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
