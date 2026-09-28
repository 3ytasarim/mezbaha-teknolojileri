import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";

import { blogJsonLd, breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getBlogListing } from "@/lib/queries";
import { SectionHeading } from "@/components/public/section-heading";
import { BlogCard } from "@/components/public/blog-card";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  const metadata = await buildMetadata({ title: d.blog.metaTitle, description: d.blog.metaDescription, path: "/blog", locale });
  // RSS: okuyucular ve arama araçları için (bkz. /blog/rss.xml)
  metadata.alternates = { ...metadata.alternates, types: { "application/rss+xml": localizePath(locale, "/blog") + "/rss.xml" } };
  return metadata;
}

export default async function BlogListingPage() {
  const { locale, d } = await getI18n();
  const b = d.blog;
  const posts = await getBlogListing(locale);

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: b.metaTitle, path: localizePath(locale, "/blog") },
          ])
        )}
      />

      <script
        {...jsonLdScriptProps(
          blogJsonLd({
            name: b.jsonLdName,
            description: b.metaDescription,
            path: localizePath(locale, "/blog"),
            locale,
            posts: posts.map((p) => ({ title: p.translations[0]?.title ?? p.slug, path: localizePath(locale, `/blog/${slugOf(p, locale)}`) })),
          })
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{b.metaTitle}</span>
      </nav>

      <SectionHeading as="h1" className="mt-6" eyebrow={b.eyebrow} title={b.metaTitle} />

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
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
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">{b.empty}</p>
        )}
      </div>
    </main>
  );
}
