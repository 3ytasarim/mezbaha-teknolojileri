"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

const STATUS_CODES = [301, 302, 307, 308] as const;

const normalize = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);

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

export type RedirectFormState = { error?: string };

function parseForm(formData: FormData) {
  return redirectSchema.safeParse({
    sourcePath: formData.get("sourcePath"),
    destinationPath: formData.get("destinationPath"),
    statusCode: formData.get("statusCode") || 301,
    active: formData.get("active") === "on",
  });
}

function refresh() {
  revalidatePath("/admin/seo/redirectler");
}

/** Kendine ve karşılıklı (A→B, B→A) yönlendirme döngülerini engeller. */
async function loopError(source: string, destination: string, ignoreId?: string): Promise<string | null> {
  const src = normalize(source);
  const dst = normalize(destination);
  if (dst === src) return "Eski ve yeni adres aynı olamaz (sonsuz döngü).";
  if (destination.startsWith("/")) {
    const back = await prisma.redirect.findFirst({
      where: { sourcePath: dst, destinationPath: { in: [src, `${src}/`] }, active: true, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
    });
    if (back) return `"${dst}" adresi zaten "${src}" adresine yönleniyor; bu, sonsuz döngü oluşturur.`;
  }
  return null;
}

export async function createRedirectAction(_prev: RedirectFormState, formData: FormData): Promise<RedirectFormState> {
  await requireAdmin("ADMIN");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const sourcePath = normalize(parsed.data.sourcePath);
  const loop = await loopError(sourcePath, parsed.data.destinationPath);
  if (loop) return { error: loop };

  if (await prisma.redirect.findUnique({ where: { sourcePath } })) {
    return { error: `"${sourcePath}" için zaten bir yönlendirme var.` };
  }

  await prisma.redirect.create({ data: { ...parsed.data, sourcePath } });
  refresh();
  redirect("/admin/seo/redirectler");
}

export async function updateRedirectAction(id: string, _prev: RedirectFormState, formData: FormData): Promise<RedirectFormState> {
  await requireAdmin("ADMIN");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const sourcePath = normalize(parsed.data.sourcePath);
  const loop = await loopError(sourcePath, parsed.data.destinationPath, id);
  if (loop) return { error: loop };

  const owner = await prisma.redirect.findUnique({ where: { sourcePath } });
  if (owner && owner.id !== id) return { error: `"${sourcePath}" için zaten bir yönlendirme var.` };

  await prisma.redirect.update({ where: { id }, data: { ...parsed.data, sourcePath } });
  refresh();
  redirect("/admin/seo/redirectler");
}

export async function toggleRedirectAction(id: string) {
  await requireAdmin("ADMIN");
  const row = await prisma.redirect.findUnique({ where: { id }, select: { active: true } });
  if (!row) return;
  await prisma.redirect.update({ where: { id }, data: { active: !row.active } });
  refresh();
}

export async function deleteRedirectAction(id: string) {
  await requireAdmin("ADMIN");
  await prisma.redirect.delete({ where: { id } });
  refresh();
}
