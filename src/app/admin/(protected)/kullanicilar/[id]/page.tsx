import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { UserForm } from "../user-form";
import { updateUserAction } from "../actions";

export default async function EditUserPage({ params }: PageProps<"/admin/kullanicilar/[id]">) {
  const me = await requireAdmin("SUPERADMIN");
  const { id } = await params;

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Kullanıcı Düzenle — {user.name}</h1>
      <div className="mt-6">
        <UserForm
          isEdit
          isSelf={me.id === user.id}
          action={updateUserAction.bind(null, id)}
          initialValues={{ name: user.name, email: user.email, role: user.role, active: user.active }}
        />
      </div>
    </div>
  );
}
