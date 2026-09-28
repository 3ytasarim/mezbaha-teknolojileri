import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePageAction } from "./actions";
import type { ContentStatus } from "@prisma/client";

const STATUS_LABEL: Record<ContentStatus, string> = { DRAFT: "Taslak", PUBLISHED: "Yayında", ARCHIVED: "Arşivlendi" };
const STATUS_STYLE: Record<ContentStatus, string> = {
  DRAFT: "bg-amber-500/15 text-amber-300",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300",
  ARCHIVED: "bg-neutral-700 text-neutral-300",
};

/** Hizmet sayfaları (sitede /hizmetler altında). */
export default async function AdminPagesPage() {
  await requireAdmin("EDITOR");
  const pages = await prisma.page.findMany({
    where: { pageType: "service" },
    orderBy: { updatedAt: "desc" },
    include: { translations: { where: { locale: "tr" } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Hizmet Sayfaları</h1>
          <p className="mt-1 text-sm text-neutral-400">Sitede Hizmetler bölümünde yayınlanan sayfalar. {pages.length} sayfa.</p>
        </div>
        <Link href="/admin/sayfalar/yeni" className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900">
          + Yeni Sayfa
        </Link>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {pages.map((page) => (
          <li key={page.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-neutral-100">{page.translations[0]?.title ?? page.slug}</p>
              <p className="mt-0.5 text-xs text-neutral-500">/hizmetler/{page.slug}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[page.status]}`}>{STATUS_LABEL[page.status]}</span>
            <div className="flex items-center gap-4">
              {page.status === "PUBLISHED" && (
                <a href={`/hizmetler/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-300 hover:text-white">
                  Görüntüle
                </a>
              )}
              <Link href={`/admin/sayfalar/${page.id}`} className="text-sm font-medium text-neutral-100 hover:underline">
                Düzenle
              </Link>
              <DeleteButton action={deletePageAction.bind(null, page.id)} confirmMessage={`"${page.translations[0]?.title ?? page.slug}" sayfası silinsin mi?`} />
            </div>
          </li>
        ))}
        {pages.length === 0 && <li className="text-sm text-neutral-400">Henüz hizmet sayfası yok.</li>}
      </ul>
    </div>
  );
}
