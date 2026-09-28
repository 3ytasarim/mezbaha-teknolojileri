import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { logout } from "./actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="admin-theme flex min-h-screen flex-col bg-neutral-950 md:flex-row">
      <AdminSidebar />

      <div className="flex flex-1 flex-col">
        <header className="hidden items-center justify-between border-b border-neutral-800 px-6 py-4 md:flex">
          <span className="text-sm text-neutral-400">
            {user.name} · {user.role}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-900"
            >
              Çıkış Yap
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
