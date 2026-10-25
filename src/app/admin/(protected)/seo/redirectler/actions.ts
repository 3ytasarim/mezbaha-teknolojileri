"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { saveRedirect, toggleRedirect } from "@/lib/seo/redirect-service";
import { prismaRedirectStore, sitemapCanonicalPaths } from "@/lib/seo/redirect-store";

const STATUS_CODES = [301, 302, 307, 308] as const;

const redirectSchema = z.object({
  sourcePath: z
    .string()
    .trim()
    .min(2, "Eski adres gerekli.")
    .refine((v) => v.startsWith("/"), "Eski adres / ile başlamalı (ör. /tr/eski-sayfa).")
    .refine((v) => !/[?#\s]/.test(v), "Eski adres yalnızca yol olmalı; ? # ve boşluk içeremez.")
    .refine((v) => !/^\/(admin|api|_next)(\/|$)/.test(v), "Bu yol yönlendirilemez (admin, api, _next)."),
  destinationPath: z
    .string()
    .trim()
    .min(1, "Yeni adres gerekli.")
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Yeni adres / ile (site içi) veya https:// ile başlamalı."),
  statusCode: z.coerce.number().refine((n) => (STATUS_CODES as readonly number[]).includes(n), "Geçersiz durum kodu."),
  active: z.coerce.boolean().default(true),
});

export type RedirectFormValues = { sourcePath: string; destinationPath: string; statusCode: number; active: boolean };
/** `values`: hata durumunda formun girilen değerlerle kalması için (React formu işlem sonrası sıfırlar). */
export type RedirectFormState = { error?: string; values?: RedirectFormValues };
/** Satırdaki Aç/Kapat düğmesi için: başarısızlık kullanıcıya gösterilir, sessiz kalmaz. */
export type ToggleRedirectState = { error?: string; ok?: boolean };

function readForm(formData: FormData): RedirectFormValues {
  return {
    sourcePath: String(formData.get("sourcePath") ?? ""),
    destinationPath: String(formData.get("destinationPath") ?? ""),
    statusCode: Number(formData.get("statusCode") || 301),
    active: formData.get("active") === "on",
  };
}

function parseForm(formData: FormData) {
  return redirectSchema.safeParse(readForm(formData));
}

function refresh() {
  revalidatePath("/admin/seo/redirectler");
}

export async function createRedirectAction(_prev: RedirectFormState, formData: FormData): Promise<RedirectFormState> {
  await requireAdmin("ADMIN");
  const values = readForm(formData);
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz.", values };

  const result = await saveRedirect({ store: prismaRedirectStore, canonical: sitemapCanonicalPaths, input: parsed.data });
  if (!result.ok) return { error: result.error, values };

  refresh();
  redirect("/admin/seo/redirectler");
}

export async function updateRedirectAction(id: string, _prev: RedirectFormState, formData: FormData): Promise<RedirectFormState> {
  await requireAdmin("ADMIN");
  const values = readForm(formData);
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz.", values };

  const result = await saveRedirect({ store: prismaRedirectStore, canonical: sitemapCanonicalPaths, input: parsed.data, id });
  if (!result.ok) return { error: result.error, values };

  refresh();
  redirect("/admin/seo/redirectler");
}

// useActionState imzası (state, formData) gerektirir; ikisi de kullanılmaz.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function toggleRedirectAction(id: string, _prev: ToggleRedirectState, _formData: FormData): Promise<ToggleRedirectState> {
  await requireAdmin("ADMIN");
  const result = await toggleRedirect({ store: prismaRedirectStore, canonical: sitemapCanonicalPaths, id });
  refresh();
  return result.ok ? { ok: true } : { error: result.error };
}

export async function deleteRedirectAction(id: string) {
  await requireAdmin("ADMIN");
  await prisma.redirect.deleteMany({ where: { id } }); // başka yönetici zaten sildiyse hata fırlatma
  refresh();
}
