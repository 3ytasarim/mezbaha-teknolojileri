"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { slugify, isReservedSlug } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı."),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı."),
  description: z.string().optional(),
});

export type BlogCategoryFormState = { error?: string };

function parseForm(formData: FormData) {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  return schema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    description: formData.get("description") || undefined,
  });
}

export async function createBlogCategoryAction(
  _prev: BlogCategoryFormState,
  formData: FormData
): Promise<BlogCategoryFormState> {
  await requireAdmin("ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const { name, slug, description } = parsed.data;

  if (isReservedSlug(slug)) return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };

  const existing = await prisma.blogCategory.findUnique({ where: { slug } });
  if (existing) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };

  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.blogCategory.create({ data: { slug } });
    await tx.blogCategoryTranslation.create({
      data: { categoryId: created.id, locale: "tr", name, description },
    });
    return created;
  });

  revalidatePath("/admin/blog-kategorileri");
  revalidatePath("/blog");
  redirect(`/admin/blog-kategorileri/${category.id}`);
}

export async function updateBlogCategoryAction(
  id: string,
  _prev: BlogCategoryFormState,
  formData: FormData
): Promise<BlogCategoryFormState> {
  await requireAdmin("ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const { name, slug, description } = parsed.data;

  if (isReservedSlug(slug)) return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };

  const existing = await prisma.blogCategory.findUnique({ where: { slug } });
  if (existing && existing.id !== id) return { error: `"${slug}" slug'ı zaten kullanılıyor.` };

  await prisma.$transaction(async (tx) => {
    await tx.blogCategory.update({ where: { id }, data: { slug } });
    await tx.blogCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: id, locale: "tr" } },
      create: { categoryId: id, locale: "tr", name, description },
      update: { name, description },
    });
  });

  revalidatePath("/admin/blog-kategorileri");
  revalidatePath("/blog");

  return {};
}

export async function deleteBlogCategoryAction(id: string) {
  await requireAdmin("ADMIN");

  const postCount = await prisma.blogPost.count({ where: { categoryId: id } });
  if (postCount > 0) {
    throw new Error(
      `Bu kategoriye bağlı ${postCount} blog yazısı var, önce onları başka kategoriye taşıyın veya silin.`
    );
  }

  await prisma.blogCategory.delete({ where: { id } });
  revalidatePath("/admin/blog-kategorileri");
  revalidatePath("/blog");
}
