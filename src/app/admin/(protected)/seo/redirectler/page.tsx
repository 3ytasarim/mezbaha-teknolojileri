import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteRedirectAction, toggleRedirectAction } from "./actions";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

/** Eski adresten yeni adrese yönlendirmeler (eski sitenin adreslerini koruyarak SEO değerini taşır). */
export default async function AdminRedirectsPage({ searchParams }: PageProps<"/admin/seo/redirectler">) {
  await requireAdmin("ADMIN");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.durum === "string" ? sp.durum : "";
  const page = Math.max(1, parseInt(typeof sp.sayfa === "string" ? sp.sayfa : "1", 10) || 1);

  const where: Prisma.RedirectWhereInput = {
    ...(q ? { OR: [{ sourcePath: { contains: q, mode: "insensitive" } }, { destinationPath: { contains: q, mode: "insensitive" } }] } : {}),
    ...(status === "aktif" ? { active: true } : status === "pasif" ? { active: false } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.redirect.findMany({ where, orderBy: { sourcePath: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.redirect.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (n: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("durum", status);
    if (n > 1) qs.set("sayfa", String(n));
    const s = qs.toString();
    return s ? `/admin/seo/redirectler?${s}` : "/admin/seo/redirectler";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Yönlendirmeler</h1>
          <p className="mt-1 text-sm text-neutral-400">{total} kayıt. Değişiklikler yaklaşık 1 dakika içinde etkili olur.</p>
        </div>
        <Link href="/admin/seo/redirectler/yeni" className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900">
          + Yeni Yönlendirme
        </Link>
      </div>

      <form action="/admin/seo/redirectler" className="mt-6 flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Adres ara..."
          className="h-10 w-64 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none focus:border-neutral-400"
        />
        <select name="durum" defaultValue={status} className="h-10 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100">
          <option value="">Tümü</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
        <button type="submit" className="h-10 rounded-md border border-neutral-700 px-4 text-sm text-neutral-200 hover:bg-neutral-800">
          Filtrele
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Eski adres</th>
              <th className="px-4 py-3 font-medium">Yeni adres</th>
              <th className="px-4 py-3 font-medium">Tür</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-900/60">
                <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-neutral-200" title={row.sourcePath}>{row.sourcePath}</td>
                <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-neutral-300" title={row.destinationPath}>{row.destinationPath}</td>
                <td className="px-4 py-3 text-neutral-300">{row.statusCode}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${row.active ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-700 text-neutral-300"}`}>
                    {row.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <form action={toggleRedirectAction.bind(null, row.id)}>
                      <button type="submit" className="text-sm font-medium text-neutral-300 hover:text-white">
                        {row.active ? "Kapat" : "Aç"}
                      </button>
                    </form>
                    <Link href={`/admin/seo/redirectler/${row.id}`} className="text-sm font-medium text-neutral-100 hover:underline">
                      Düzenle
                    </Link>
                    <DeleteButton action={deleteRedirectAction.bind(null, row.id)} confirmMessage={`"${row.sourcePath}" yönlendirmesi silinsin mi?`} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Sayfalar" className="mt-6 flex flex-wrap items-center gap-2">
          {page > 1 && (
            <Link href={href(page - 1)} className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
              ← Önceki
            </Link>
          )}
          <span className="px-2 text-sm text-neutral-400">
            Sayfa {page} / {pages}
          </span>
          {page < pages && (
            <Link href={href(page + 1)} className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800">
              Sonraki →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
