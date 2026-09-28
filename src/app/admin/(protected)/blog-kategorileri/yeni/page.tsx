import { requireAdmin } from "@/lib/auth/guard";
import { BlogCategoryForm } from "../category-form";
import { createBlogCategoryAction } from "../actions";

export default async function NewBlogCategoryPage() {
  await requireAdmin("ADMIN");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Blog Kategorisi</h1>
      <div className="mt-6">
        <BlogCategoryForm action={createBlogCategoryAction} />
      </div>
    </div>
  );
}
