import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteUserAction } from "./actions";
import type { AdminRole } from "@prisma/client";

const ROLE_LABEL: Record<AdminRole, string> = { SUPERADMIN: "Süper Admin", ADMIN: "Yönetici", EDITOR: "Editör" };
const ROLE_STYLE: Record<AdminRole, string> = {
  SUPERADMIN: "bg-orange-500/15 text-orange-300",
  ADMIN: "bg-sky-500/15 text-sky-300",
  EDITOR: "bg-neutral-700 text-neutral-200",
};

/** Yönetim paneli kullanıcıları (yalnızca süper admin). */
export default async function AdminUsersPage() {
  const me = await requireAdmin("SUPERADMIN");
  const users = await prisma.adminUser.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-neutral-400">{users.length} kullanıcı. Yalnızca süper admin bu sayfayı görür.</p>
        </div>
        <Link href="/admin/kullanicilar/yeni" className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900">
          + Yeni Kullanıcı
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Son giriş</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-900/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-100">
                    {user.name}
                    {user.id === me.id && <span className="ml-2 text-xs font-normal text-neutral-400">(siz)</span>}
                  </p>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[user.role]}`}>{ROLE_LABEL[user.role]}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.active ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-700 text-neutral-300"}`}>
                    {user.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  {user.lastLoginAt ? user.lastLoginAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/admin/kullanicilar/${user.id}`} className="text-sm font-medium text-neutral-100 hover:underline">
                      Düzenle
                    </Link>
                    {user.id !== me.id && (
                      <DeleteButton action={deleteUserAction.bind(null, user.id)} confirmMessage={`"${user.name}" kullanıcısı silinsin mi? Bu işlem geri alınamaz.`} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
