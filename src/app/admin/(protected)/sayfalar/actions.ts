"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { slugify, isReservedSlug } from "@/lib/slug";
import { sanitizeContentHtml } from "@/lib/sanitize";
import type { ContentStatus } from "@prisma/client";

/** Hizmet sayfaları (Page, pageType = "service"): sitede /hizmetler ve /hizmetler/<slug> altında yayınlanır. */
const pageSchema = z.object({
  title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı.").max(160),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı."),
  content: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  ogImage: z.string().optional(),
});

export type PageFormState = { error?: string };

function parseForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  return pageSchema.safeParse({
    title,
    slug: slugify(rawSlug || title),
    content: formData.get("content") || undefined,
    status: formData.get("status") || "DRAFT",
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    ogImage: formData.get("ogImage") || undefined,
  });
}

function refresh(slug?: string) {
  revalidatePath("/admin/sayfalar");
  revalidatePath("/hizmetler");
  if (slug) revalidatePath(`/hizmetler/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createPageAction(_prev: PageFormState, formData: FormData): Promise<PageFormState> {
  await requireAdmin("EDITOR");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  const { title, slug, status, content, ...seo } = parsed.data;

  if (isReservedSlug(slug)) return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  if (await prisma.page.findUnique({ where: { slug } })) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };

  const page = await prisma.page.create({
    data: {
      slug,
      pageType: "service",
      status: status as ContentStatus,
      translations: {
        create: { locale: "tr", title, content: content ? sanitizeContentHtml(content) : undefined, ...seo },
      },
    },
  });

  refresh(slug);
  redirect(`/admin/sayfalar/${page.id}`);
}

export async function updatePageAction(id: string, _prev: PageFormState, formData: FormData): Promise<PageFormState> {
  await requireAdmin("EDITOR");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  const { title, slug, status, content, ...seo } = parsed.data;

  if (isReservedSlug(slug)) return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  const owner = await prisma.page.findUnique({ where: { slug } });
  if (owner && owner.id !== id) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };

  const existing = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return { error: "Sayfa bulunamadı." };

  const html = content ? sanitizeContentHtml(content) : undefined;
  await prisma.$transaction([
    prisma.page.update({ where: { id }, data: { slug, status: status as ContentStatus } }),
    prisma.pageTranslation.upsert({
      where: { pageId_locale: { pageId: id, locale: "tr" } },
      create: { pageId: id, locale: "tr", title, content: html, ...seo },
      update: { title, content: html, ...seo },
    }),
  ]);

  refresh(slug);
  if (existing.slug !== slug) revalidatePath(`/hizmetler/${existing.slug}`);
  return {};
}

export async function deletePageAction(id: string) {
  await requireAdmin("ADMIN");
  const page = await prisma.page.findUnique({ where: { id }, select: { slug: true } });
  if (!page) return;
  await prisma.page.delete({ where: { id } });
  refresh(page.slug);
}
