import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { BlogPostForm } from "../post-form";
import { createBlogPostAction } from "../actions";

export default async function NewBlogPostPage() {
  await requireAdmin("EDITOR");

  const [categories, products, projects] = await Promise.all([
    prisma.blogCategory.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.product.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.project.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Blog Yazısı</h1>
      <div className="mt-6">
        <BlogPostForm
          action={createBlogPostAction}
          categories={categories.map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.slug }))}
          productOptions={products.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          projectOptions={projects.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
        />
      </div>
    </div>
  );
}
