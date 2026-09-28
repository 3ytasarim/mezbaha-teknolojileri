import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  await requireAdmin("EDITOR");

  const [categories, projects, posts] = await Promise.all([
    prisma.productCategory.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.project.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.blogPost.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Ürün</h1>
      <div className="mt-6">
        <ProductForm
          action={createProductAction}
          categories={categories.map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.slug }))}
          projectOptions={projects.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          postOptions={posts.map((p) => ({ id: p.id, label: p.translations[0]?.title ?? p.slug }))}
        />
      </div>
    </div>
  );
}
