import Link from "@/components/i18n/link";
import { SectionHeading } from "@/components/public/section-heading";
import { getI18n } from "@/lib/i18n/server";

/** Ürünler, kategori ve Hakkımızda sayfalarının ortak mavi başlık bandı: yol çubuğu, rozet, turuncu başlık, açıklama, kategori hapları. */
export async function ProductsHero({
  eyebrow,
  crumbs,
  title,
  description,
  chips,
}: {
  /** Verilmezse geçerli dildeki "Ürünler" */
  eyebrow?: string;
  crumbs: { label: string; href?: string }[];
  title: string;
  description?: string;
  chips: { label: string; href: string; active?: boolean }[];
}) {
  const { d } = await getI18n();
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#16204a] via-primary to-[#2f3f7d] py-16 text-white md:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute -end-24 -top-24 -z-10 size-96 rounded-full blob-accent opacity-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label={d.ui.breadcrumb} className="text-sm text-white/75">
          {crumbs.map((crumb, i) => (
            <span key={crumb.label}>
              {i > 0 && <span className="mx-2">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-white hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <SectionHeading
          as="h1"
          tone="dark"
          titleClassName="text-orange-400"
          className="mt-6"
          eyebrow={eyebrow ?? d.products.productsLink}
          title={title}
          description={description}
        />
        {chips.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-3">
            {chips.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                aria-current={chip.active ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  chip.active ? "bg-white text-primary" : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
