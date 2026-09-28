import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBlogCategoryAction } from "./actions";

export default async function AdminBlogCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.blogCategory.findMany({
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale: "tr" } }, _count: { select: { posts: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Blog Kategorileri</h1>
        <Link
          href="/admin/blog-kategorileri/yeni"
          className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900"
        >
          + Yeni Kategori
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Yazı Sayısı</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3 text-neutral-100">
                  {category.translations[0]?.name ?? "(çeviri yok)"}
                </td>
                <td className="px-4 py-3 text-neutral-400">{category.slug}</td>
                <td className="px-4 py-3 text-neutral-400">{category._count.posts}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/blog-kategorileri/${category.id}`}
                      className="text-sm font-medium text-neutral-200 hover:text-white"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      action={deleteBlogCategoryAction.bind(null, category.id)}
                      confirmMessage={`"${category.translations[0]?.name ?? category.slug}" kategorisini silmek istediğinize emin misiniz?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  Henüz kategori yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
