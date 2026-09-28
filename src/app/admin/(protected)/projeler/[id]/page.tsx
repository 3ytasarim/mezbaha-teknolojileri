import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { ProjectForm } from "../project-form";
import { updateProjectAction } from "../actions";

export default async function EditProjectPage({ params }: PageProps<"/admin/projeler/[id]">) {
  await requireAdmin("EDITOR");
  const { id } = await params;

  const [project, products, posts] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        translations: { where: { locale: "tr" } },
        images: { orderBy: { sortOrder: "asc" } },
        relatedProducts: { select: { id: true } },
        relatedPosts: { select: { id: true } },
      },
    }),
    prisma.product.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.blogPost.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  if (!project) notFound();

  const translation = project.translations[0];
  const boundAction = updateProjectAction.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Proje Düzenle — {translation?.name}</h1>
      <div className="mt-6">
        <ProjectForm
          action={boundAction}
          productOptions={products.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          postOptions={posts.map((p) => ({ id: p.id, label: p.translations[0]?.title ?? p.slug }))}
          initialValues={{
            name: translation?.name ?? "",
            slug: project.slug,
            type: project.type,
            country: project.country,
            city: project.city ?? "",
            capacity: project.capacity ?? "",
            area: project.area ?? "",
            shortDescription: translation?.shortDescription ?? "",
            description: translation?.description ?? "",
            coverImage: project.coverImage ?? "",
            coverImageAlt: project.coverImageAlt ?? "",
            videoUrl: project.videoUrl ?? "",
            sortOrder: project.sortOrder,
            featured: project.featured,
            status: project.status,
            publishedAt: project.publishedAt ? project.publishedAt.toISOString().slice(0, 10) : "",
            seoTitle: translation?.seoTitle ?? "",
            seoDescription: translation?.seoDescription ?? "",
            ogImage: translation?.ogImage ?? "",
            gallery: project.images.map((img) => ({
              url: img.imageUrl,
              alt: img.alt ?? "",
              caption: img.caption ?? "",
            })),
            relatedProductIds: project.relatedProducts.map((p) => p.id),
            relatedPostIds: project.relatedPosts.map((p) => p.id),
          }}
        />
      </div>
    </div>
  );
}
