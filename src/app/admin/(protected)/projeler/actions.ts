"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { slugify, isReservedSlug } from "@/lib/slug";
import { sanitizeContentHtml } from "@/lib/sanitize";
import type { ContentStatus, ProjectType } from "@prisma/client";

const galleryItemSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional().default(""),
  caption: z.string().optional().default(""),
});

const projectSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı."),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı."),
  type: z.enum(["REFERENCE", "CAPACITY_SOLUTION"]),
  country: z.string().min(1, "Ülke gerekli."),
  city: z.string().optional(),
  capacity: z.string().optional(),
  area: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageAlt: z.string().trim().max(160).optional(),
  videoUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  featured: z.coerce.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

export type ProjectFormState = {
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

  const parsed = projectSchema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    type: formData.get("type") || "REFERENCE",
    country: formData.get("country"),
    city: formData.get("city") || undefined,
    capacity: formData.get("capacity") || undefined,
    area: formData.get("area") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    coverImageAlt: formData.get("coverImageAlt") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    featured: formData.get("featured") === "on",
    status: formData.get("status") || "DRAFT",
    publishedAt: formData.get("publishedAt") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    ogImage: formData.get("ogImage") || undefined,
  });

  const gallery = parseJson(formData.get("gallery"), galleryItemSchema);
  const relatedProductIds = formData.getAll("relatedProductIds").map(String);
  const relatedPostIds = formData.getAll("relatedPostIds").map(String);

  return { parsed, gallery, relatedProductIds, relatedPostIds };
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin("EDITOR");

  const { parsed, gallery, relatedProductIds, relatedPostIds } = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const { name, slug, status, type, publishedAt, ...rest } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  }

  const slugOwner = await prisma.project.findUnique({ where: { slug } });
  if (slugOwner) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        slug,
        type: type as ProjectType,
        country: rest.country,
        city: rest.city,
        capacity: rest.capacity,
        area: rest.area,
        coverImage: rest.coverImage,
        coverImageAlt: rest.coverImage ? rest.coverImageAlt : null,
        videoUrl: rest.videoUrl,
        sortOrder: rest.sortOrder,
        featured: rest.featured,
        status: status as ContentStatus,
        publishedAt: publishedAt ? new Date(publishedAt) : status === "PUBLISHED" ? new Date() : null,
        relatedProducts: { connect: relatedProductIds.map((id) => ({ id })) },
        relatedPosts: { connect: relatedPostIds.map((id) => ({ id })) },
      },
    });

    await tx.projectTranslation.create({
      data: {
        projectId: created.id,
        locale: "tr",
        name,
        shortDescription: rest.shortDescription,
        description: rest.description ? sanitizeContentHtml(rest.description) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        ogImage: rest.ogImage,
      },
    });

    if (gallery.length > 0) {
      await tx.projectImage.createMany({
        data: gallery.map((item, index) => ({
          projectId: created.id,
          imageUrl: item.url,
          alt: item.alt,
          caption: item.caption,
          sortOrder: index,
        })),
      });
    }

    return created;
  });

  revalidateProjectPaths(slug);
  redirect(`/admin/projeler/${project.id}`);
}

export async function updateProjectAction(
  id: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin("EDITOR");

  const { parsed, gallery, relatedProductIds, relatedPostIds } = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const { name, slug, status, type, publishedAt, ...rest } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  }

  const [slugOwner, existing] = await Promise.all([
    prisma.project.findUnique({ where: { slug } }),
    prisma.project.findUnique({ where: { id }, select: { slug: true, publishedAt: true } }),
  ]);

  if (slugOwner && slugOwner.id !== id) {
    return { error: `"${slug}" slug'ı zaten kullanılıyor.` };
  }
  if (!existing) return { error: "Proje bulunamadı." };

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        slug,
        type: type as ProjectType,
        country: rest.country,
        city: rest.city,
        capacity: rest.capacity,
        area: rest.area,
        coverImage: rest.coverImage,
        coverImageAlt: rest.coverImage ? rest.coverImageAlt : null,
        videoUrl: rest.videoUrl,
        sortOrder: rest.sortOrder,
        featured: rest.featured,
        status: status as ContentStatus,
        publishedAt: publishedAt
          ? new Date(publishedAt)
          : status === "PUBLISHED"
            ? (existing.publishedAt ?? new Date())
            : existing.publishedAt,
        relatedProducts: { set: relatedProductIds.map((rid) => ({ id: rid })) },
        relatedPosts: { set: relatedPostIds.map((rid) => ({ id: rid })) },
      },
    });

    await tx.projectTranslation.upsert({
      where: { projectId_locale: { projectId: id, locale: "tr" } },
      create: {
        projectId: id,
        locale: "tr",
        name,
        shortDescription: rest.shortDescription,
        description: rest.description ? sanitizeContentHtml(rest.description) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        ogImage: rest.ogImage,
      },
      update: {
        name,
        shortDescription: rest.shortDescription,
        description: rest.description ? sanitizeContentHtml(rest.description) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        ogImage: rest.ogImage,
      },
    });

    await tx.projectImage.deleteMany({ where: { projectId: id } });
    if (gallery.length > 0) {
      await tx.projectImage.createMany({
        data: gallery.map((item, index) => ({
          projectId: id,
          imageUrl: item.url,
          alt: item.alt,
          caption: item.caption,
          sortOrder: index,
        })),
      });
    }
  });

  revalidateProjectPaths(slug);
  if (existing.slug !== slug) revalidatePath(`/projeler/${existing.slug}`);
  revalidatePath(`/admin/projeler/${id}`);

  return {};
}

export async function deleteProjectAction(id: string) {
  await requireAdmin("ADMIN");

  const project = await prisma.project.findUnique({ where: { id }, select: { slug: true } });
  if (!project) return;

  await prisma.project.delete({ where: { id } });
  revalidateProjectPaths(project.slug);
}

function revalidateProjectPaths(slug: string) {
  revalidatePath("/admin/projeler");
  revalidatePath(`/projeler/${slug}`);
  revalidatePath("/projeler");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
