import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBlogPostAction } from "./actions";
import type { ContentStatus, Prisma } from "@prisma/client";

const STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivlendi",
};

export default async function AdminBlogPage({ searchParams }: PageProps<"/admin/blog">) {
  await requireAdmin();
  const sp = await searchParams;

  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const categoryId = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";

  const where: Prisma.BlogPostWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as ContentStatus } : {}),
    ...(search
      ? { translations: { some: { locale: "tr", title: { contains: search, mode: "insensitive" } } } }
      : {}),
  };

  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        translations: { where: { locale: "tr" } },
        category: { include: { translations: { where: { locale: "tr" } } } },
      },
    }),
    prisma.blogCategory.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Blog</h1>
        <Link
          href="/admin/blog/yeni"
          className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900"
        >
          + Yeni Yazı
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/blog">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Başlık ara..."
          className="h-10 flex-1 min-w-[180px] rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100"
        />
        <select
          name="category"
          defaultValue={categoryId}
          className="h-10 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.translations[0]?.name ?? c.slug}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100"
        >
          <option value="">Tüm Durumlar</option>
          <option value="DRAFT">Taslak</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="ARCHIVED">Arşivlendi</option>
        </select>
        <button type="submit" className="h-10 rounded-md border border-neutral-700 px-4 text-sm text-neutral-200">
          Filtrele
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Öne Çıkan</th>
              <th className="px-4 py-3">Güncellendi</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md bg-neutral-900">
                    {post.coverImage && (
                      <Image src={post.coverImage} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-100">
                  {post.translations[0]?.title ?? "(çeviri yok)"}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {post.category?.translations[0]?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-400">{STATUS_LABEL[post.status]}</td>
                <td className="px-4 py-3 text-neutral-400">{post.featured ? "Evet" : "—"}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {post.updatedAt.toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-sm font-medium text-neutral-200 hover:text-white"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      action={deleteBlogPostAction.bind(null, post.id)}
                      confirmMessage={`"${post.translations[0]?.title ?? post.slug}" yazısını silmek istediğinize emin misiniz?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Sonuç bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
