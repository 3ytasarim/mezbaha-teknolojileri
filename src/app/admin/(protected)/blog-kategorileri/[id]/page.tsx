import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { BlogCategoryForm } from "../category-form";
import { updateBlogCategoryAction } from "../actions";

export default async function EditBlogCategoryPage({
  params,
}: PageProps<"/admin/blog-kategorileri/[id]">) {
  await requireAdmin("ADMIN");
  const { id } = await params;

  const category = await prisma.blogCategory.findUnique({
    where: { id },
    include: { translations: { where: { locale: "tr" } } },
  });

  if (!category) notFound();

  const translation = category.translations[0];
  const boundAction = updateBlogCategoryAction.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">
        Kategori Düzenle — {translation?.name}
      </h1>
      <div className="mt-6">
        <BlogCategoryForm
          action={boundAction}
          initialValues={{
            name: translation?.name ?? "",
            slug: category.slug,
            description: translation?.description ?? "",
          }}
        />
      </div>
    </div>
  );
}
