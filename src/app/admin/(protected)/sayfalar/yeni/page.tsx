import { requireAdmin } from "@/lib/auth/guard";
import { PageForm } from "../page-form";
import { createPageAction } from "../actions";

export default async function NewPagePage() {
  await requireAdmin("EDITOR");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Hizmet Sayfası</h1>
      <div className="mt-6">
        <PageForm action={createPageAction} />
      </div>
    </div>
  );
}
