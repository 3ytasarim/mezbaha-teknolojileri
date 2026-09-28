import { requireAdmin } from "@/lib/auth/guard";
import { UserForm } from "../user-form";
import { createUserAction } from "../actions";

export default async function NewUserPage() {
  await requireAdmin("SUPERADMIN");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Kullanıcı</h1>
      <div className="mt-6">
        <UserForm action={createUserAction} />
      </div>
    </div>
  );
}
