import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { LOCALE_META } from "@/lib/i18n/config";

import { breadcrumbListJsonLd, breadcrumbId, blogPostingJsonLd, webPageGraphJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getLocalImageMeta } from "@/lib/seo/image-meta";
import { getBlogPostBySlug, getRecentBlogPosts, getRelatedBlogPosts, getLocaleSlugs } from "@/lib/queries";
import { entityAlternates } from "@/lib/i18n/alternates";
import { SITE_NAME, getSiteUrl } from "@/lib/seo/site";
import { tagHref, tagLabel } from "@/lib/blog-tags";
import { SectionHeading } from "@/components/public/section-heading";
import { BlogCard } from "@/components/public/blog-card";
import { ShareButtons } from "@/components/public/share-buttons";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getI18n();
  const post = await getBlogPostBySlug(slug, locale);
  if (!post) return {};

  const translation = post.translations[0];

  // Etiket kayıtları (BlogTag) tek dillidir (Türkçe): diğer dillerde etiket gösterilmez/yazılmaz.
  const tags = locale === "tr" ? post.tags : [];
  const tagNames = tags.map(tagLabel);

  const base = await buildMetadata({
    title: translation?.seoTitle || translation?.title || post.slug,
    description: translation?.seoDescription || translation?.excerpt || "",
    path: translation?.canonicalUrl || `/blog/${slugOf(post, locale)}`,
    ogImage: translation?.ogImage || post.coverImage || undefined,
    type: "article",
    locale,
    alternates: entityAlternates("/blog", await getLocaleSlugs("blog", post.id, post.slug)) ?? false,
  });

  return {
    ...base,
    ...(tagNames.length ? { keywords: tagNames } : {}),
    other: tagNames.length ? { "article:tag": tagNames } : undefined,
  };
}

export default async function BlogPostDetailPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const { locale, d } = await getI18n();
  const b = d.blog;
  const post = await getBlogPostBySlug(slug, locale);
  if (!post) notFound();
  const postSlug = slugOf(post, locale);
  const tags = locale === "tr" ? post.tags : [];
  const intl = LOCALE_META[locale].intl;

  const translation = post.translations[0];
  const authorName = post.authorType === "company" ? SITE_NAME : (post.authorName ?? SITE_NAME);
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}${localizePath(locale, `/blog/${postSlug}`)}`;
  const shareImage = post.coverImage ? new URL(post.coverImage, siteUrl).toString() : undefined;
  const blogPath = localizePath(locale, `/blog/${postSlug}`);
  const coverImageMeta = post.coverImage ? await getLocalImageMeta(post.coverImage) : null;
  const [recent, related] = await Promise.all([getRecentBlogPosts(post.id, 5, locale), getRelatedBlogPosts(post.id, tags.map((t) => t.id), 4, locale)]);

  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: b.metaTitle, path: localizePath(locale, "/blog") },
            { name: translation?.title ?? post.slug, path: localizePath(locale, `/blog/${postSlug}`) },
          ])
        )}
      />
      <script
        {...jsonLdScriptProps(
          blogPostingJsonLd({
            title: translation?.title ?? post.slug,
            description: translation?.excerpt ?? "",
            path: blogPath,
            image: post.coverImage ?? undefined,
            authorName,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            keywords: tags.map(tagLabel),
            locale,
          })
        )}
      />
      <script
        {...jsonLdScriptProps(
          webPageGraphJsonLd({
            path: blogPath,
            name: translation?.title ?? post.slug,
            description: translation?.excerpt ?? undefined,
            locale,
            breadcrumbId: breadcrumbId(blogPath),
            primaryImage: post.coverImage
              ? { url: post.coverImage, name: translation?.title ?? post.slug, ...(coverImageMeta ? { dimensions: coverImageMeta } : {}) }
              : undefined,
          })
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-foreground">{b.metaTitle}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{translation?.title ?? post.slug}</span>
      </nav>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div className="min-w-0">
      <article>
        <header>
          <SectionHeading
            as="h1"
            eyebrow={post.category?.translations[0]?.name}
            title={translation?.title ?? post.slug}
          />
          {translation?.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{translation.excerpt}</p>
          )}
          <div className="mt-6">
            <ShareButtons url={postUrl} title={translation?.title ?? post.slug} image={shareImage} />
          </div>
          <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{authorName}</span>
            {post.publishedAt && (
              <>
                <span>·</span>
                <time dateTime={post.publishedAt.toISOString()}>
                  {post.publishedAt.toLocaleDateString(intl, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
          </div>
        </header>

        {post.coverImage && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-muted">
            <Image
              src={post.coverImage}
              alt={translation?.title ?? post.slug}
              fill
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {translation?.content && (
          <div
            className="prose prose-neutral mt-8 max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: translation.content }}
          />
        )}

        {tags.length > 0 && (
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-sm font-semibold text-foreground">{b.tags}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={tagHref(tag.slug)}
                    className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    #{tagLabel(tag)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

      </article>

      {related.length > 0 && (
        <section aria-labelledby="ilgili-yazilar" className="mt-14 border-t border-border pt-10">
          <h2 id="ilgili-yazilar" className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            {b.related}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {related.map((item) => {
              const t = item.translations[0];
              return (
                <BlogCard
                  key={item.id}
                  as="h3"
                  slug={slugOf(item, locale)}
                  title={t?.title ?? item.slug}
                  excerpt={t?.excerpt}
                  image={item.coverImage}
                  publishedAt={item.publishedAt}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                />
              );
            })}
          </div>
        </section>
      )}

      {(post.relatedProducts.length > 0 || post.relatedProjects.length > 0) && (
        <section className="mt-16 border-t border-border pt-10">
          {post.relatedProducts.length > 0 && (
            <>
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                {b.relatedProducts}
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {post.relatedProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/urun/${slugOf(product, locale)}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {product.translations[0]?.name ?? product.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {post.relatedProjects.length > 0 && (
            <>
              <h2 className="mt-8 font-heading text-xl font-bold tracking-tight text-foreground">
                {b.relatedProjects}
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {post.relatedProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projeler/${slugOf(project, locale)}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {project.translations[0]?.name ?? project.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      </div>

      {recent.length > 0 && (
        <aside aria-labelledby="son-gonderiler" className="lg:pt-1">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              <h2 id="son-gonderiler" className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
                {b.recent}
              </h2>
            </div>
            <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
              {recent.map((item) => {
                const t = item.translations[0];
                return (
                  <li key={item.id}>
                    <Link href={`/blog/${slugOf(item, locale)}`} className="group flex items-start gap-4 py-4">
                      {item.coverImage && (
                        <div className="relative h-[68px] w-24 shrink-0 overflow-hidden bg-muted">
                          <Image src={item.coverImage} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {t?.title ?? item.slug}
                        </h3>
                        {item.publishedAt && (
                          <time dateTime={item.publishedAt.toISOString()} className="mt-1.5 block text-xs text-muted-foreground">
                            {item.publishedAt.toLocaleDateString(intl, { year: "numeric", month: "long", day: "numeric" })}
                          </time>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href="/blog" className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:underline">
              {b.allPosts}
            </Link>
          </div>
        </aside>
      )}
      </div>
    </main>
  );
}
