import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { CANONICAL_LOCALE, LOCALE_META, RTL_LOCALES, isLocale, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routes";
import { TARGET_LOCALES, getTranslationDoc, isKind, kindHasField, kindLabel, kindPublicPath, kindTitleLabel, type FieldKey } from "@/lib/admin-translations";
import { TranslationForm } from "@/components/admin/translation-form";
import { deleteTranslationAction, saveTranslationAction } from "../../actions";

/** Bir içeriğin tek bir dildeki çevirisini düzenler. Dil sekmeleri ?dil= ile seçilir (sunucuda render edilir). */
export default async function TranslationEditorPage({ params, searchParams }: { params: Promise<{ kind: string; id: string }>; searchParams: Promise<{ dil?: string }> }) {
  await requireAdmin("EDITOR");
  const { kind, id } = await params;
  const { dil } = await searchParams;
  if (!isKind(kind)) notFound();
  const doc = await getTranslationDoc(kind, id);
  if (!doc) notFound();

  const locale: Locale = isLocale(dil) && dil !== CANONICAL_LOCALE ? dil : TARGET_LOCALES[0];
  const values = doc.byLocale[locale] ?? {};
  const exists = Boolean(doc.byLocale[locale]);

  const all: { key: FieldKey; label: string; multiline?: number; hint?: string; html?: boolean }[] = [
    { key: "title", label: kindTitleLabel(kind) },
    { key: "slug", label: "URL slug'ı", hint: "a-z, 0-9 ve tire. Boş bırakırsanız başlıktan üretilir. Bu dilde benzersiz olmalı." },
    { key: "short", label: "Kısa açıklama / özet", multiline: 3 },
    { key: "body", label: kind === "blog" || kind === "sayfa" ? "İçerik (HTML)" : "Açıklama", multiline: 10, html: kind === "blog" || kind === "sayfa" || kind === "urun" },
    { key: "applications", label: "Kullanım alanları (HTML)", multiline: 6, html: true },
    { key: "features", label: "Öne çıkan özellikler (HTML)", multiline: 6, html: true },
    { key: "seoTitle", label: "SEO başlığı", hint: "En fazla 60 karakter önerilir (marka adı hariç)." },
    { key: "seoDescription", label: "SEO açıklaması", multiline: 3, hint: "70–160 karakter önerilir." },
  ];
  const fields = all.filter((f) => kindHasField(kind, f.key));

  const publicUrl = values.slug ? localizePath(locale, kindPublicPath(kind, values.slug)) : null;

  return (
    <div>
      <p className="text-sm text-neutral-500">
        <Link href="/admin/ceviriler" className="hover:text-neutral-300">
          Çeviriler
        </Link>{" "}
        / {kindLabel(kind)}
      </p>
      <h1 className="mt-1 text-xl font-semibold text-neutral-100">{doc.reference.title}</h1>

      <nav aria-label="Diller" className="mt-5 flex flex-wrap gap-2">
        {TARGET_LOCALES.map((l) => {
          const has = Boolean(doc.byLocale[l]);
          return (
            <Link
              key={l}
              href={`/admin/ceviriler/${kind}/${id}?dil=${l}`}
              aria-current={l === locale ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${l === locale ? "bg-neutral-100 text-neutral-900" : has ? "bg-emerald-900/40 text-emerald-300" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
            >
              {LOCALE_META[l].nativeName}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 max-w-3xl">
        <p className="mb-4 text-sm text-neutral-400">
          {exists ? "Bu dilde çeviri var." : "Bu dilde henüz çeviri yok; kaydedince oluşturulur."}
          {publicUrl && (
            <>
              {" "}
              Adres: <code className="text-neutral-300">{publicUrl}</code>
            </>
          )}
        </p>
        <TranslationForm
          key={`${kind}-${id}-${locale}`}
          action={saveTranslationAction.bind(null, kind, id, locale)}
          fields={fields}
          values={values}
          reference={doc.reference}
          rtl={RTL_LOCALES.includes(locale)}
          lang={locale}
        />
        {exists && (
          <form action={deleteTranslationAction.bind(null, kind, id, locale)} className="mt-8 border-t border-neutral-800 pt-5">
            <p className="text-sm text-neutral-400">Bu dildeki çeviriyi silerseniz içerik o dilde yayından kalkar.</p>
            <button type="submit" className="mt-2 rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40">
              {LOCALE_META[locale].nativeName} çevirisini sil
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
