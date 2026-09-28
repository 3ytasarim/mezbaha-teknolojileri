import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

const AI_AND_SEARCH_AGENTS = [
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      ...AI_AND_SEARCH_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/api"],
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
