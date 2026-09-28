import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { updateProductAction } from "../actions";

export default async function EditProductPage({ params }: PageProps<"/admin/urunler/[id]">) {
  await requireAdmin("EDITOR");
  const { id } = await params;

  const [product, categories, projects, posts] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: { where: { locale: "tr" } },
        images: { orderBy: { sortOrder: "asc" } },
        specifications: { where: { locale: "tr" }, orderBy: { sortOrder: "asc" } },
        documents: { orderBy: { sortOrder: "asc" } },
        relatedProjects: { select: { id: true } },
        relatedPosts: { select: { id: true } },
      },
    }),
    prisma.productCategory.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.project.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.blogPost.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  if (!product) notFound();

  const translation = product.translations[0];
  const boundAction = updateProductAction.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Ürün Düzenle — {translation?.name}</h1>
      <div className="mt-6">
        <ProductForm
          action={boundAction}
          categories={categories.map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.slug }))}
          projectOptions={projects.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          postOptions={posts.map((p) => ({ id: p.id, label: p.translations[0]?.title ?? p.slug }))}
          initialValues={{
            name: translation?.name ?? "",
            slug: product.slug,
            categoryId: product.categoryId,
            sku: product.sku ?? "",
            shortDescription: translation?.shortDescription ?? "",
            description: translation?.description ?? "",
            applications: translation?.applications ?? "",
            features: translation?.features ?? "",
            status: product.status,
            featured: product.featured,
            active: product.active,
            sortOrder: product.sortOrder,
            coverImage: product.coverImage ?? "",
            coverImageAlt: product.coverImageAlt ?? "",
            videoUrl: product.videoUrl ?? "",
            seoTitle: translation?.seoTitle ?? "",
            seoDescription: translation?.seoDescription ?? "",
            canonicalUrl: translation?.canonicalUrl ?? "",
            ogImage: translation?.ogImage ?? "",
            gallery: product.images.map((img) => ({
              url: img.imageUrl,
              alt: img.alt ?? "",
              caption: img.caption ?? "",
            })),
            specifications: product.specifications.map((s) => ({ label: s.label, value: s.value })),
            documents: product.documents.map((d) => ({
              title: d.title,
              fileUrl: d.fileUrl,
              mimeType: d.mimeType,
              fileSize: d.fileSize,
            })),
            relatedProjectIds: product.relatedProjects.map((p) => p.id),
            relatedPostIds: product.relatedPosts.map((p) => p.id),
          }}
        />
      </div>
    </div>
  );
}
