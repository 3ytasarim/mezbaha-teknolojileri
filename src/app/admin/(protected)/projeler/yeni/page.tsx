import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { ProjectForm } from "../project-form";
import { createProjectAction } from "../actions";

export default async function NewProjectPage() {
  await requireAdmin("EDITOR");

  const [products, posts] = await Promise.all([
    prisma.product.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.blogPost.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Proje</h1>
      <div className="mt-6">
        <ProjectForm
          action={createProjectAction}
          productOptions={products.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          postOptions={posts.map((p) => ({ id: p.id, label: p.translations[0]?.title ?? p.slug }))}
        />
      </div>
    </div>
  );
}
