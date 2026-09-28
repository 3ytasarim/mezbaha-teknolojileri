import { requireAdmin } from "@/lib/auth/guard";
import { CategoryForm } from "../category-form";
import { createCategoryAction } from "../actions";

export default async function NewCategoryPage() {
  await requireAdmin("ADMIN");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Ürün Kategorisi</h1>
      <div className="mt-6">
        <CategoryForm action={createCategoryAction} />
      </div>
    </div>
  );
}
