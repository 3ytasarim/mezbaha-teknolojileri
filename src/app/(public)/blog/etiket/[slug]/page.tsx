import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { format } from "@/lib/i18n/dictionaries";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getBlogTagWithPosts } from "@/lib/queries";
import { tagLabel } from "@/lib/blog-tags";
import { SectionHeading } from "@/components/public/section-heading";
import { BlogCard } from "@/components/public/blog-card";

/** Etiket sayfası: /blog/etiket/<slug> — etikete sahip yazıların listesi (konu kümesi, iç bağlantı ve SEO için). */
export async function generateMetadata({ params }: PageProps<"/blog/etiket/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  // Etiket kayıtları çevrilmediği için etiket sayfaları yalnızca Türkçedir.
  const tag = locale === "tr" ? await getBlogTagWithPosts(slug, locale) : null;
  if (!tag || tag.posts.length === 0) return {};
  const label = tagLabel(tag);

  return buildMetadata({
    title: format(d.blog.tagMetaTitle, { label }),
    description: format(d.blog.tagMetaDescription, {
      label,
      titles: tag.posts
        .slice(0, 3)
        .map((p) => p.translations[0]?.title)
        .filter(Boolean)
        .join(", "),
    }),
    path: `/blog/etiket/${tag.slug}`,
    locale,
    alternates: false, // etiket sayfaları yalnızca Türkçe
  });
}

export default async function BlogTagPage({ params }: PageProps<"/blog/etiket/[slug]">) {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const b = d.blog;
  const tag = locale === "tr" ? await getBlogTagWithPosts(slug, locale) : null;
  if (!tag || tag.posts.length === 0) notFound();
  const label = tagLabel(tag);

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: b.metaTitle, path: localizePath(locale, "/blog") },
            { name: label, path: localizePath(locale, `/blog/etiket/${tag.slug}`) },
          ])
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-foreground">{b.metaTitle}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{label}</span>
      </nav>

      <SectionHeading
        as="h1"
        className="mt-6"
        eyebrow={b.tagEyebrow}
        title={label}
        description={format(b.tagCount, { n: String(tag.posts.length) })}
      />

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {tag.posts.map((post) => {
          const t = post.translations[0];
          return (
            <BlogCard
              key={post.id}
              slug={slugOf(post, locale)}
              title={t?.title ?? post.slug}
              excerpt={t?.excerpt}
              image={post.coverImage}
              category={post.category?.translations[0]?.name}
              publishedAt={post.publishedAt}
            />
          );
        })}
      </div>
    </main>
  );
}
