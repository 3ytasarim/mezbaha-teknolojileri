import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProjectAction } from "./actions";

const TYPE_LABEL = { REFERENCE: "Referans Proje", CAPACITY_SOLUTION: "Kapasite Paketi" } as const;
const STATUS_LABEL = { DRAFT: "Taslak", PUBLISHED: "Yayında", ARCHIVED: "Arşivlendi" } as const;

export default async function AdminProjectsPage() {
  await requireAdmin();

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { translations: { where: { locale: "tr" } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Projeler</h1>
        <Link
          href="/admin/projeler/yeni"
          className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900"
        >
          + Yeni Proje
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Ülke / Şehir</th>
              <th className="px-4 py-3">Kapasite</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Öne Çıkan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md bg-neutral-900">
                    {project.coverImage && (
                      <Image src={project.coverImage} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-100">
                  {project.translations[0]?.name ?? "(çeviri yok)"}
                </td>
                <td className="px-4 py-3 text-neutral-400">{TYPE_LABEL[project.type]}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {project.country}
                  {project.city ? ` — ${project.city}` : ""}
                </td>
                <td className="px-4 py-3 text-neutral-400">{project.capacity ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-400">{STATUS_LABEL[project.status]}</td>
                <td className="px-4 py-3 text-neutral-400">{project.featured ? "Evet" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/projeler/${project.id}`}
                      className="text-sm font-medium text-neutral-200 hover:text-white"
                    >
                      Düzenle
                    </Link>
                    <DeleteButton
                      action={deleteProjectAction.bind(null, project.id)}
                      confirmMessage={`"${project.translations[0]?.name ?? project.slug}" projesini silmek istediğinize emin misiniz?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                  Henüz proje yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
