import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { CategoryForm } from "../category-form";
import { updateCategoryAction } from "../actions";

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/urun-kategorileri/[id]">) {
  await requireAdmin("ADMIN");
  const { id } = await params;

  const category = await prisma.productCategory.findUnique({
    where: { id },
    include: { translations: { where: { locale: "tr" } } },
  });

  if (!category) notFound();

  const translation = category.translations[0];
  const boundAction = updateCategoryAction.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">
        Kategori Düzenle — {translation?.name}
      </h1>
      <div className="mt-6">
        <CategoryForm
          action={boundAction}
          initialValues={{
            name: translation?.name ?? "",
            slug: category.slug,
            shortDescription: translation?.shortDescription ?? "",
            description: translation?.description ?? "",
            image: category.image ?? "",
            icon: category.icon ?? "",
            sortOrder: category.sortOrder,
            active: category.active,
            seoTitle: translation?.seoTitle ?? "",
            seoDescription: translation?.seoDescription ?? "",
          }}
        />
      </div>
    </div>
  );
}
