import { getBlogListing } from "@/lib/queries";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { slugOf } from "@/lib/i18n/slug";
import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";

/** /blog/rss.xml — son blog yazıları (RSS 2.0). Yeni yazı yayınlanınca otomatik güncellenir. */

/** Dile göre (x-lang başlığı) değiştiği için her istekte üretilir. */
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const siteUrl = getSiteUrl();
  const { locale, d } = await getI18n();
  const posts = (await getBlogListing(locale)).slice(0, 30);

  const items = posts
    .map((post) => {
      const t = post.translations[0];
      const url = `${siteUrl}${localizePath(locale, `/blog/${slugOf(post, locale)}`)}`;
      return [
        "    <item>",
        `      <title>${esc(t?.title ?? post.slug)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        post.publishedAt ? `      <pubDate>${post.publishedAt.toUTCString()}</pubDate>` : "",
        t?.excerpt ? `      <description>${esc(t.excerpt)}</description>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} Blog</title>
    <link>${siteUrl}${localizePath(locale, "/blog")}</link>
    <atom:link href="${siteUrl}${localizePath(locale, "/blog")}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(d.blog.rssDescription)}</description>
    <language>${d.blog.rssLang}</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
