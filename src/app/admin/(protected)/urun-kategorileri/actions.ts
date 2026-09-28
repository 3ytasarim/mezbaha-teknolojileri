"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { slugify, isReservedSlug } from "@/lib/slug";

const categorySchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı."),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı."),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.coerce.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type CategoryFormState = {
  error?: string;
};

function parseForm(formData: FormData) {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  return categorySchema.safeParse({
    name,
    slug: slugify(rawSlug || name),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
    icon: formData.get("icon") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin("ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const { name, slug, ...rest } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  }

  const existing = await prisma.productCategory.findUnique({ where: { slug } });
  if (existing) {
    return { error: `"${slug}" slug'ı zaten kullanılıyor.` };
  }

  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.productCategory.create({
      data: {
        slug,
        image: rest.image,
        icon: rest.icon,
        sortOrder: rest.sortOrder,
        active: rest.active,
      },
    });

    await tx.productCategoryTranslation.create({
      data: {
        categoryId: created.id,
        locale: "tr",
        name,
        shortDescription: rest.shortDescription,
        description: rest.description,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
      },
    });

    return created;
  });

  revalidatePath("/admin/urun-kategorileri");
  revalidatePath("/urunler");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  redirect(`/admin/urun-kategorileri/${category.id}`);
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin("ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };
  }

  const { name, slug, ...rest } = parsed.data;

  if (isReservedSlug(slug)) {
    return { error: `"${slug}" ayrılmış bir URL, başka bir slug seçin.` };
  }

  const existing = await prisma.productCategory.findUnique({ where: { slug } });
  if (existing && existing.id !== id) {
    return { error: `"${slug}" slug'ı zaten kullanılıyor.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.productCategory.update({
      where: { id },
      data: {
        slug,
        image: rest.image,
        icon: rest.icon,
        sortOrder: rest.sortOrder,
        active: rest.active,
      },
    });

    await tx.productCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: id, locale: "tr" } },
      create: {
        categoryId: id,
        locale: "tr",
        name,
        shortDescription: rest.shortDescription,
        description: rest.description,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
      },
      update: {
        name,
        shortDescription: rest.shortDescription,
        description: rest.description,
        seoTitle: rest.seoTitle,
        seoDescription: rest.seoDescription,
      },
    });
  });

  revalidatePath("/admin/urun-kategorileri");
  revalidatePath(`/admin/urun-kategorileri/${id}`);
  revalidatePath("/urunler");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return {};
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin("ADMIN");

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(
      `Bu kategoriye bağlı ${productCount} ürün var, önce onları başka kategoriye taşıyın veya silin.`
    );
  }

  await prisma.productCategory.delete({ where: { id } });

  revalidatePath("/admin/urun-kategorileri");
  revalidatePath("/urunler");
  revalidatePath("/sitemap.xml");
}
