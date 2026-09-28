import { requireAdmin } from "@/lib/auth/guard";
import { RedirectForm } from "../redirect-form";
import { createRedirectAction } from "../actions";

export default async function NewRedirectPage() {
  await requireAdmin("ADMIN");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Yönlendirme</h1>
      <div className="mt-6">
        <RedirectForm action={createRedirectAction} />
      </div>
    </div>
  );
}
