import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { BlogPostForm } from "../post-form";
import { updateBlogPostAction } from "../actions";

export default async function EditBlogPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  await requireAdmin("EDITOR");
  const { id } = await params;

  const [post, categories, products, projects] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: { where: { locale: "tr" } },
        tags: true,
        relatedProducts: { select: { id: true } },
        relatedProjects: { select: { id: true } },
      },
    }),
    prisma.blogCategory.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.product.findMany({ include: { translations: { where: { locale: "tr" } } } }),
    prisma.project.findMany({ include: { translations: { where: { locale: "tr" } } } }),
  ]);

  if (!post) notFound();

  const translation = post.translations[0];
  const boundAction = updateBlogPostAction.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yazı Düzenle — {translation?.title}</h1>
      <div className="mt-6">
        <BlogPostForm
          action={boundAction}
          categories={categories.map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.slug }))}
          productOptions={products.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          projectOptions={projects.map((p) => ({ id: p.id, label: p.translations[0]?.name ?? p.slug }))}
          initialValues={{
            title: translation?.title ?? "",
            slug: post.slug,
            categoryId: post.categoryId ?? "",
            tags: post.tags.map((t) => t.name ?? t.slug).join(", "),
            excerpt: translation?.excerpt ?? "",
            content: translation?.content ?? "",
            coverImage: post.coverImage ?? "",
            coverImageAlt: post.coverImageAlt ?? "",
            authorName: post.authorName ?? "",
            status: post.status,
            featured: post.featured,
            publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 10) : "",
            seoTitle: translation?.seoTitle ?? "",
            seoDescription: translation?.seoDescription ?? "",
            canonicalUrl: translation?.canonicalUrl ?? "",
            ogImage: translation?.ogImage ?? "",
            relatedProductIds: post.relatedProducts.map((p) => p.id),
            relatedProjectIds: post.relatedProjects.map((p) => p.id),
          }}
        />
      </div>
    </div>
  );
}
