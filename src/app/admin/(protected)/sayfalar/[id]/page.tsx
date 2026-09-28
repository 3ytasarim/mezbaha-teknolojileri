import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { PageForm } from "../page-form";
import { updatePageAction } from "../actions";

export default async function EditPagePage({ params }: PageProps<"/admin/sayfalar/[id]">) {
  await requireAdmin("EDITOR");
  const { id } = await params;

  const page = await prisma.page.findUnique({ where: { id }, include: { translations: { where: { locale: "tr" } } } });
  if (!page) notFound();
  const t = page.translations[0];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Sayfa Düzenle — {t?.title ?? page.slug}</h1>
      <div className="mt-6">
        <PageForm
          action={updatePageAction.bind(null, id)}
          initialValues={{
            title: t?.title ?? "",
            slug: page.slug,
            content: t?.content ?? "",
            status: page.status,
            seoTitle: t?.seoTitle ?? "",
            seoDescription: t?.seoDescription ?? "",
            ogImage: t?.ogImage ?? "",
          }}
        />
      </div>
    </div>
  );
}
