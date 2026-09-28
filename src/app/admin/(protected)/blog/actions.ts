"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { slugify, isReservedSlug } from "@/lib/slug";
import { sanitizeContentHtml } from "@/lib/sanitize";
import type { ContentStatus } from "@prisma/client";

const postSchema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter olmalı."),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı."),
  categoryId: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  coverImageAlt: z.string().trim().max(160).optional(),
  authorName: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean().default(false),
  publishedAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
});

export type BlogPostFormState = { error?: string };

function parseForm(formData: FormData) {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  const parsed = postSchema.safeParse({
    title,
    slug: slugify(rawSlug || title),
    categoryId: formData.get("categoryId") || undefined,
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    coverImageAlt: formData.get("coverImageAlt") || undefined,
    authorName: formData.get("authorName") || undefined,
    status: formData.get("status") || "DRAFT",
    featured: formData.get("featured") === "on",
    publishedAt: formData.get("publishedAt") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    canonicalUrl: formData.get("canonicalUrl") || undefined,
    ogImage: formData.get("ogImage") || undefined,
  });

  const tagsRaw = String(formData.get("tags") ?? "");
  // Etiketler "görünen ad" olarak girilir (Türkçe karakterli); slug'ı ondan üretilir. Aynı slug tek sayılır.
  const tagMap = new Map<string, string>();
  for (const raw of tagsRaw.split(",")) {
    const name = raw.trim().replace(/^#/, "");
    const slug = slugify(name);
    if (slug && !tagMap.has(slug)) tagMap.set(slug, name);
  }
  const tags = Array.from(tagMap, ([slug, name]) => ({ slug, name }));

  const relatedProductIds = formData.getAll("relatedProductIds").map(String);
  const relatedProjectIds = formData.getAll("relatedProjectIds").map(String);

  return { parsed, tags, relatedProductIds, relatedProjectIds };
}

const TAGS_REQUIRED_MESSAGE = "En az bir etiket girin (virgülle ayırın). Etiketler yazının bulunmasını ve SEO'yu güçlendirir.";

async function resolveTagIds(tags: { slug: string; name: string }[]): Promise<string[]> {
  const ids: string[] = [];
  for (const { slug, name } of tags) {
    const tag = await prisma.blogTag.upsert({
      where: { slug },
      create: { slug, name },
      update: { name },
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function createBlogPostAction(
  _prev: BlogPostFormState,
  formData: FormData
): Promise<BlogPostFormState> {
  await requireAdmin("EDITOR");

  const { parsed, tags, relatedProductIds, relatedProjectIds } = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  if (tags.length === 0) return { error: TAGS_REQUIRED_MESSAGE };

  const { title, slug, status, publishedAt, categoryId, ...rest } = parsed.data;

  if (isReservedSlug(slug)) return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };

  const slugOwner = await prisma.blogPost.findUnique({ where: { slug } });
  if (slugOwner) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };

  const tagIds = await resolveTagIds(tags);

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.blogPost.create({
      data: {
        slug,
        categoryId: categoryId || null,
        coverImage: rest.coverImage,
        coverImageAlt: rest.coverImage ? rest.coverImageAlt : null,
        authorType: "company",
        authorName: rest.authorName,
        status: status as ContentStatus,
        featured: rest.featured,
        publishedAt: publishedAt ? new Date(publishedAt) : status === "PUBLISHED" ? new Date() : null,
        tags: { connect: tagIds.map((id) => ({ id })) },
        relatedProducts: { connect: relatedProductIds.map((id) => ({ id })) },
        relatedProjects: { connect: relatedProjectIds.map((id) => ({ id })) },
      },
    });

    await tx.blogPostTranslation.create({
      data: {
        blogPostId: created.id,
        locale: "tr",
        title,
        excerpt: rest.excerpt,
        content: rest.content ? sanitizeContentHtml(rest.content) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        canonicalUrl: rest.canonicalUrl,
        ogImage: rest.ogImage,
      },
    });

    return created;
  });

  revalidateBlogPaths(slug);
  redirect(`/admin/blog/${post.id}`);
}

export async function updateBlogPostAction(
  id: string,
  _prev: BlogPostFormState,
  formData: FormData
): Promise<BlogPostFormState> {
  await requireAdmin("EDITOR");

  const { parsed, tags, relatedProductIds, relatedProjectIds } = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  if (tags.length === 0) return { error: TAGS_REQUIRED_MESSAGE };

  const { title, slug, status, publishedAt, categoryId, ...rest } = parsed.data;

  if (isReservedSlug(slug)) return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };

  const [slugOwner, existing] = await Promise.all([
    prisma.blogPost.findUnique({ where: { slug } }),
    prisma.blogPost.findUnique({ where: { id }, select: { slug: true, publishedAt: true } }),
  ]);

  if (slugOwner && slugOwner.id !== id) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };
  if (!existing) return { error: "Yazı bulunamadı." };

  const tagIds = await resolveTagIds(tags);

  await prisma.$transaction(async (tx) => {
    await tx.blogPost.update({
      where: { id },
      data: {
        slug,
        categoryId: categoryId || null,
        coverImage: rest.coverImage,
        coverImageAlt: rest.coverImage ? rest.coverImageAlt : null,
        authorName: rest.authorName,
        status: status as ContentStatus,
        featured: rest.featured,
        publishedAt: publishedAt
          ? new Date(publishedAt)
          : status === "PUBLISHED"
            ? (existing.publishedAt ?? new Date())
            : existing.publishedAt,
        tags: { set: tagIds.map((tid) => ({ id: tid })) },
        relatedProducts: { set: relatedProductIds.map((rid) => ({ id: rid })) },
        relatedProjects: { set: relatedProjectIds.map((rid) => ({ id: rid })) },
      },
    });

    await tx.blogPostTranslation.upsert({
      where: { blogPostId_locale: { blogPostId: id, locale: "tr" } },
      create: {
        blogPostId: id,
        locale: "tr",
        title,
        excerpt: rest.excerpt,
        content: rest.content ? sanitizeContentHtml(rest.content) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        canonicalUrl: rest.canonicalUrl,
        ogImage: rest.ogImage,
      },
      update: {
        title,
        excerpt: rest.excerpt,
        content: rest.content ? sanitizeContentHtml(rest.content) : undefined,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
        canonicalUrl: rest.canonicalUrl,
        ogImage: rest.ogImage,
      },
    });
  });

  revalidateBlogPaths(slug);
  if (existing.slug !== slug) revalidatePath(`/blog/${existing.slug}`);
  revalidatePath(`/admin/blog/${id}`);

  return {};
}

export async function deleteBlogPostAction(id: string) {
  await requireAdmin("ADMIN");

  const post = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
  if (!post) return;

  await prisma.blogPost.delete({ where: { id } });
  revalidateBlogPaths(post.slug);
}

function revalidateBlogPaths(slug: string) {
  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}
