"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { sanitizeContentHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";
import { isLocale, CANONICAL_LOCALE, type Locale } from "@/lib/i18n/config";
import { isKind, kindHtmlFields, kindHasField, removeTranslation, saveTranslation, slugTaken, type FieldKey, type TranslationKind } from "@/lib/admin-translations";

export type TranslationFormState = { status: "idle" | "success" | "error"; message?: string; errors?: Partial<Record<FieldKey, string>> };

const RU_MAP: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };

/** Slug: küçük harf, yalnızca a-z 0-9 ve tire. Kiril harfler Latin'e çevrilir; Türkçe karakterler `slugify` ile. */
function normalizeSlug(input: string): string {
  const translit = [...input.toLowerCase()].map((ch) => RU_MAP[ch] ?? ch).join("");
  return slugify(translit).replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const val = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function parse(kind: TranslationKind, fd: FormData) {
  const raw: Record<FieldKey, string> = {
    title: val(fd, "title"), slug: val(fd, "slug"), short: val(fd, "short"), body: val(fd, "body"),
    applications: val(fd, "applications"), features: val(fd, "features"), seoTitle: val(fd, "seoTitle"), seoDescription: val(fd, "seoDescription"),
  };
  for (const f of kindHtmlFields(kind)) if (raw[f]) raw[f] = sanitizeContentHtml(raw[f]);
  return raw;
}

export async function saveTranslationAction(kind: string, id: string, locale: string, _prev: TranslationFormState, fd: FormData): Promise<TranslationFormState> {
  await requireAdmin("EDITOR");
  if (!isKind(kind) || !isLocale(locale) || locale === CANONICAL_LOCALE) return { status: "error", message: "Geçersiz istek." };
  const v = parse(kind, fd);
  const errors: TranslationFormState["errors"] = {};
  if (v.title.length < 2) errors.title = "Başlık/ad en az 2 karakter olmalı.";
  const slug = normalizeSlug(v.slug || v.title);
  if (slug.length < 2) errors.slug = "Geçerli bir slug üretilemedi; a-z, 0-9 ve tire kullanın.";
  if (v.seoTitle.length > 70) errors.seoTitle = "SEO başlığı en fazla 70 karakter olmalı (öneri: 60).";
  if (v.seoDescription.length > 200) errors.seoDescription = "SEO açıklaması en fazla 200 karakter olmalı (öneri: 70–160).";
  if (Object.keys(errors).length) return { status: "error", message: "Lütfen işaretli alanları kontrol edin.", errors };

  if (await slugTaken(kind, id, locale as Locale, slug)) return { status: "error", message: `"${slug}" bu dilde başka bir kayıtta kullanılıyor.`, errors: { slug: "Bu slug bu dilde zaten kullanılıyor." } };

  const clean: Record<string, string> = { title: v.title, slug };
  for (const f of ["short", "body", "applications", "features", "seoTitle", "seoDescription"] as FieldKey[]) if (kindHasField(kind, f)) clean[f] = v[f];
  await saveTranslation(kind, id, locale as Locale, clean as never);
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/ceviriler/${kind}/${id}`);
  return { status: "success", message: "Çeviri kaydedildi." };
}

export async function deleteTranslationAction(kind: string, id: string, locale: string): Promise<void> {
  await requireAdmin("ADMIN");
  if (!isKind(kind) || !isLocale(locale) || locale === CANONICAL_LOCALE) return;
  await removeTranslation(kind, id, locale as Locale);
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/ceviriler/${kind}/${id}`);
  revalidatePath("/admin/ceviriler");
}
