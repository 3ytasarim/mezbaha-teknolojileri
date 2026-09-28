import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProductAction } from "./actions";
import type { ContentStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivlendi",
};

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/urunler">) {
  await requireAdmin();
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page) || 1);
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const categoryId = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const featured = typeof sp.featured === "string" ? sp.featured : "";

  const where: Prisma.ProductWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as ContentStatus } : {}),
    ...(featured === "1" ? { featured: true } : {}),
    ...(search
      ? { translations: { some: { locale: "tr", name: { contains: search, mode: "insensitive" } } } }
      : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        translations: { where: { locale: "tr" } },
        category: { include: { translations: { where: { locale: "tr" } } } },
      },
    }),
    prisma.product.count({ where }),
    prisma.productCategory.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Ürünler</h1>
        <Link
          href="/admin/urunler/yeni"
          className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900"
        >
          + Yeni Ürün
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/urunler">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Ürün adı ara..."
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
        <select
          name="featured"
          defaultValue={featured}
          className="h-10 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100"
        >
          <option value="">Öne Çıkan / Tümü</option>
          <option value="1">Yalnızca Öne Çıkan</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-md border border-neutral-700 px-4 text-sm text-neutral-200"
        >
          Filtrele
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Öne Çıkan</th>
              <th className="px-4 py-3">Güncellendi</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md bg-neutral-900">
                    {product.coverImage && (
                      <Image src={product.coverImage} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-100">
                  {product.translations[0]?.name ?? "(çeviri yok)"}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {product.category.translations[0]?.name ?? product.category.slug}
                </td>
                <td className="px-4 py-3 text-neutral-400">{STATUS_LABEL[product.status]}</td>
                <td className="px-4 py-3 text-neutral-400">{product.featured ? "Evet" : "—"}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {product.updatedAt.toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/urunler/${product.id}`}
                      className="text-sm font-medium text-neutral-200 hover:text-white"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      action={deleteProductAction.bind(null, product.id)}
                      confirmMessage={`"${product.translations[0]?.name ?? product.slug}" ürününü silmek istediğinize emin misiniz?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Sonuç bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/urunler?page=${p}${search ? `&q=${encodeURIComponent(search)}` : ""}${categoryId ? `&category=${categoryId}` : ""}${status ? `&status=${status}` : ""}`}
              className={p === page ? "font-semibold text-neutral-100" : "hover:text-neutral-200"}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
