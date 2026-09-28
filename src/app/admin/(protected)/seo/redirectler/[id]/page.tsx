import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { RedirectForm } from "../redirect-form";
import { updateRedirectAction } from "../actions";

export default async function EditRedirectPage({ params }: PageProps<"/admin/seo/redirectler/[id]">) {
  await requireAdmin("ADMIN");
  const { id } = await params;

  const row = await prisma.redirect.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yönlendirme Düzenle</h1>
      <div className="mt-6">
        <RedirectForm
          action={updateRedirectAction.bind(null, id)}
          initialValues={{
            sourcePath: row.sourcePath,
            destinationPath: row.destinationPath,
            statusCode: row.statusCode,
            active: row.active,
          }}
        />
      </div>
    </div>
  );
}
