import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { cleanTitle } from "@/lib/seo/metadata";
import { LOCALES, LOCALE_META, CANONICAL_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";

/**
 * SEO denetimi (salt okunur): yayınlanan ürün, kategori, proje, blog yazısı ve hizmet sayfalarında SEO başlığı / açıklaması
 * eksikliklerini ve uzunluk sorunlarını listeler. Alanlar boşsa site başlık/özetten otomatik değer üretir; yine de elle
 * yazılmış SEO metni arama sonuçlarında daha iyi tıklama getirir. Öğeye tıklayınca düzenleme sayfası açılır.
 */
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

type Row = { id: string; name: string; seoTitle: string | null; seoDescription: string | null; editHref: string };

function issues(row: Row): string[] {
  const list: string[] = [];
  if (!row.seoTitle) list.push("SEO başlığı yok");
  else if (cleanTitle(row.seoTitle).length > TITLE_MAX) list.push(`Başlık uzun (${cleanTitle(row.seoTitle).length}/${TITLE_MAX})`);
  if (!row.seoDescription) list.push("SEO açıklaması yok");
  else if (row.seoDescription.length < DESC_MIN) list.push(`Açıklama kısa (${row.seoDescription.length})`);
  else if (row.seoDescription.length > DESC_MAX) list.push(`Açıklama uzun (${row.seoDescription.length}/${DESC_MAX})`);
  return list;
}

export default async function AdminSeoPage({ searchParams }: { searchParams: Promise<{ dil?: string }> }) {
  await requireAdmin();
  const { dil } = await searchParams;
  const locale: Locale = isLocale(dil) ? dil : CANONICAL_LOCALE;
  const tr = locale === CANONICAL_LOCALE;

  const [products, categories, projects, posts, pages, redirectCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", active: true },
      select: { id: true, slug: true, translations: { where: { locale }, select: { name: true, seoTitle: true, seoDescription: true } } },
    }),
    prisma.productCategory.findMany({
      where: { active: true },
      select: { id: true, slug: true, translations: { where: { locale }, select: { name: true, seoTitle: true, seoDescription: true } } },
    }),
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, translations: { where: { locale }, select: { name: true, seoTitle: true, seoDescription: true } } },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, translations: { where: { locale }, select: { title: true, seoTitle: true, seoDescription: true } } },
    }),
    prisma.page.findMany({
      where: { status: "PUBLISHED", pageType: "service" },
      select: { id: true, slug: true, translations: { where: { locale }, select: { title: true, seoTitle: true, seoDescription: true } } },
    }),
    prisma.redirect.count({ where: { active: true } }),
  ]);

  const hasT = (x: { translations: unknown[] }) => tr || x.translations.length > 0;
  const missing = (list: { translations: unknown[] }[]) => list.filter((x) => !hasT(x)).length;
  const editFor = (kind: string, legacy: string, id: string) => (tr ? `${legacy}/${id}` : `/admin/ceviriler/${kind}/${id}?dil=${locale}`);

  const groups: { title: string; rows: Row[]; untranslated: number }[] = [
    {
      title: "Ürünler",
      untranslated: missing(products),
      rows: products.filter(hasT).map((p) => ({ id: p.id, name: p.translations[0]?.name ?? p.slug, seoTitle: p.translations[0]?.seoTitle ?? null, seoDescription: p.translations[0]?.seoDescription ?? null, editHref: editFor("urun", "/admin/urunler", p.id) })),
    },
    {
      title: "Ürün kategorileri",
      untranslated: missing(categories),
      rows: categories.filter(hasT).map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.slug, seoTitle: c.translations[0]?.seoTitle ?? null, seoDescription: c.translations[0]?.seoDescription ?? null, editHref: editFor("kategori", "/admin/urun-kategorileri", c.id) })),
    },
    {
      title: "Projeler",
      untranslated: missing(projects),
      rows: projects.filter(hasT).map((p) => ({ id: p.id, name: p.translations[0]?.name ?? p.slug, seoTitle: p.translations[0]?.seoTitle ?? null, seoDescription: p.translations[0]?.seoDescription ?? null, editHref: editFor("proje", "/admin/projeler", p.id) })),
    },
    {
      title: "Blog yazıları",
      untranslated: missing(posts),
      rows: posts.filter(hasT).map((p) => ({ id: p.id, name: p.translations[0]?.title ?? p.slug, seoTitle: p.translations[0]?.seoTitle ?? null, seoDescription: p.translations[0]?.seoDescription ?? null, editHref: editFor("blog", "/admin/blog", p.id) })),
    },
    {
      title: "Hizmet sayfaları",
      untranslated: missing(pages),
      rows: pages.filter(hasT).map((p) => ({ id: p.id, name: p.translations[0]?.title ?? p.slug, seoTitle: p.translations[0]?.seoTitle ?? null, seoDescription: p.translations[0]?.seoDescription ?? null, editHref: editFor("sayfa", "/admin/sayfalar", p.id) })),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">SEO Yönetimi</h1>
      <p className="mt-1 max-w-3xl text-sm text-neutral-400">
        Yayınlanan içeriklerde SEO başlığı ve açıklaması durumu. Boş bırakılan alanlarda site başlık ve özetten otomatik değer üretir; elle yazılmış
        metin (başlık marka adı hariç en fazla {TITLE_MAX}, açıklama {DESC_MIN}–{DESC_MAX} karakter) arama sonuçlarında daha etkilidir.
      </p>

      <nav aria-label="Denetlenen dil" className="mt-5 flex flex-wrap gap-2">
        {LOCALES.map((l) => (
          <Link key={l} href={l === CANONICAL_LOCALE ? "/admin/seo" : `/admin/seo?dil=${l}`} aria-current={l === locale ? "page" : undefined} className={`rounded-md px-3 py-1.5 text-sm font-medium ${l === locale ? "bg-neutral-100 text-neutral-900" : "bg-neutral-800 text-neutral-300 hover:text-neutral-100"}`}>
            {LOCALE_META[l].nativeName}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-neutral-200 underline underline-offset-4">Site haritası (sitemap.xml)</a>
        <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-neutral-200 underline underline-offset-4">robots.txt</a>
        <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-neutral-200 underline underline-offset-4">llms.txt</a>
        <Link href="/admin/seo/redirectler" className="text-neutral-200 underline underline-offset-4">Yönlendirmeler ({redirectCount} aktif)</Link>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {groups.map((group) => {
          const flagged = group.rows.map((row) => ({ row, list: issues(row) })).filter((x) => x.list.length > 0);
          const ok = group.rows.length - flagged.length;
          return (
            <section key={group.title}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-neutral-100">{group.title}</h2>
                <p className="text-sm text-neutral-400">
                  {group.rows.length} kayıt · <span className="text-emerald-300">{ok} tamam</span> ·{" "}
                  <span className={flagged.length ? "text-amber-300" : "text-neutral-400"}>{flagged.length} eksik/sorunlu</span>
                  {!tr && group.untranslated > 0 && (
                    <>
                      {" "}
                      · <Link href="/admin/ceviriler" className="text-neutral-300 underline underline-offset-4">{group.untranslated} kayıtta bu dilde çeviri yok</Link>
                    </>
                  )}
                </p>
              </div>

              {flagged.length > 0 ? (
                <details className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900">
                  <summary className="cursor-pointer px-4 py-3 text-sm text-neutral-200">Eksik ve sorunlu kayıtları göster ({flagged.length})</summary>
                  <ul className="divide-y divide-neutral-800 border-t border-neutral-800">
                    {flagged.map(({ row, list }) => (
                      <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-neutral-100">{row.name}</p>
                          <p className="mt-0.5 text-xs text-amber-300">{list.join(" · ")}</p>
                        </div>
                        <Link href={row.editHref} className="text-sm font-medium text-neutral-100 hover:underline">
                          Düzenle
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <p className="mt-3 text-sm text-emerald-300">Tüm kayıtlarda SEO alanları tamam.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
