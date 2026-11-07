# 3 DISTINCT BLOG POSTS × 6 LANGUAGES — MEZBAHA TEKNOLOJILERI

**Correction:** This archive creates **THREE independent blog posts**, each with exactly ONE of the THREE user-provided images. Each post has SIX complete language variants (18 localized documents total). **DO NOT combine the images into one post.**

| Post | Main English topic | Source image | URL group |
|---|---|---|---|
| 01 | Cattle slaughter line **process flow / transfers** | `(1).jpeg` (first image) | `01-workflow` |
| 02 | Overhead **meat rail / carcass conveyor** engineering | `(2).jpeg` (second image) | `02-overhead-rail` |
| 03 | Slaughterhouse **work platforms / operator access** | unnumbered `.jpeg` (third image) | `03-work-platforms` |

### Structure
- `posts/<post>/{en,de,ar,tr,ru,fr}.md`: 18 full-length, distinct editorial content files, one H1 and ONE image per language.
- `seo/<post>/{en,de,ar,tr,ru,fr}.json`: metadata, excerpt, separate canonical candidates, reciprocal hreflang group per post, OG, Twitter, keywords, detailed image SEO and a BlogPosting schema TEMPLATE.
- `images/*webp`: three main 1600x900 WebP images and responsive 1200/800w variants.
- `images/*og.jpg`: 1200x630 JPEG Open Graph social previews.
- `docs/URL_MATRIX.csv`: 18 route suggestions, NOT confirmed live routes.
- `docs/US_KEYWORD_STRATEGY.csv`: qualitative US keyword mapping; NOT paid search volume metrics.
- `CLAUDE_CODE_INSTRUCTIONS.md`: deployment task and verification gates.

### Editorial / technical boundaries
- The source imagery consists of **conceptual 3D renderings**, not photographs of real plants. No capacities, certifications or USDA compliance may be inferred from the pictures.
- Content is written with equipment selection and plant engineering buyers in mind. Some technical claims require an actual qualified engineering assessment for a specific site.
- BlogPosting publication dates MUST be filled with real deploy dates, not manufactured dates. No false expert endorsement or author names.
- Do not put keyword lists into an HTML `meta keywords` tag. Use them only to guide titles, linking and Search Console content analysis.
- Proposed localized paths use `/blog/<slug>` for English and `/<lang>/blog/<slug>` for other languages, based on observed site routing; Claude Code MUST verify route conventions. Every localized page should self-canonicalize; hreflang must only point to live, indexed equivalents.
- Existing site has a general 3D design article, a generic rail systems article and a platform comparison article. These new articles intentionally focus on **workflow interfaces**, **engineering RFQ checks**, and **multi-station access** to reduce keyword cannibalization.

Sources for technical reference (not claims of certification):
- https://www.mezbahateknolojileri.com/blog/3d-slaughterhouse-design-facility-layout
- https://www.mezbahateknolojileri.com/blog/cattle-slaughter-line-conveyor-rail-systems
- https://www.mezbahateknolojileri.com/product/cattle-processing-line
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://ask.fsis.usda.gov/article/Does-all-visible-contamination-as-referenced-in-Food-Safety-Inspection-Service-Directive
