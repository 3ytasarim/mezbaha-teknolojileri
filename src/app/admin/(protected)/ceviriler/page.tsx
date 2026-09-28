import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { ENABLED_LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { TARGET_LOCALES, TRANSLATION_KINDS, kindPlural, listCoverage } from "@/lib/admin-translations";

/**
 * Çeviri durumu: her içerik için hangi dillerde çeviri (ve URL slug'ı) var. Bir dilde çeviri + slug yoksa o içerik o dilde
 * yayınlanmaz. Dil sitede yalnızca ENABLED_LOCALES'e eklendiğinde görünür (bkz. docs/I18N_PLAN.md).
 */
export default async function TranslationsOverviewPage() {
  await requireAdmin("EDITOR");
  const groups = await Promise.all(TRANSLATION_KINDS.map(async (kind) => ({ kind, rows: await listCoverage(kind) })));

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Çeviriler</h1>
      <p className="mt-1 max-w-3xl text-sm text-neutral-400">
        İçeriklerin dillere göre durumu. Bir dil rozetine tıklayarak o dildeki çeviriyi düzenleyin. Çevirisi (ve slug&apos;ı) olmayan içerik o dilde
        yayınlanmaz. Sitede yayında olan diller: {ENABLED_LOCALES.map((l) => LOCALE_META[l].label).join(", ")}.
      </p>

      {groups.map(({ kind, rows }) => {
        const counts = TARGET_LOCALES.map((l) => rows.filter((r) => r.locales[l] !== undefined && r.locales[l] !== "").length);
        return (
          <section key={kind} className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-neutral-100">{kindPlural(kind)}</h2>
              <p className="text-xs text-neutral-500">{TARGET_LOCALES.map((l, i) => `${LOCALE_META[l].label} ${counts[i]}/${rows.length}`).join(" · ")}</p>
            </div>
            <ul className="mt-3 divide-y divide-neutral-800 rounded-lg border border-neutral-800">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate text-sm text-neutral-200">{row.title}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {TARGET_LOCALES.map((l) => {
                      const has = row.locales[l] !== undefined && row.locales[l] !== "";
                      return (
                        <Link
                          key={l}
                          href={`/admin/ceviriler/${kind}/${row.id}?dil=${l}`}
                          className={`rounded px-2 py-1 text-xs font-semibold ${has ? "bg-emerald-900/50 text-emerald-300" : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"}`}
                          title={has ? `${LOCALE_META[l].nativeName}: /${row.locales[l]}` : `${LOCALE_META[l].nativeName}: çeviri yok`}
                        >
                          {LOCALE_META[l].label}
                        </Link>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
