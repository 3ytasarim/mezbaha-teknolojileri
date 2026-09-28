"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { DEFAULT_NAV, NAV_LOCATIONS, type NavLocation } from "@/lib/navigation";

const itemSchema = z.object({
  label: z.string().trim().min(2, "Etiket en az 2 karakter olmalı.").max(40, "Etiket en fazla 40 karakter olabilir."),
  url: z
    .string()
    .trim()
    .min(1, "Bağlantı gerekli.")
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Bağlantı / ile (site içi) veya https:// ile başlamalı.")
    .refine((v) => !/^\/admin(\/|$)/.test(v), "Menüye yönetim paneli bağlantısı eklenemez."),
});

const isLocation = (v: string): v is NavLocation => NAV_LOCATIONS.some((l) => l.key === v);

function done(error?: string): never {
  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  redirect(error ? `/admin/menu?hata=${encodeURIComponent(error)}` : "/admin/menu");
}

export async function addItemAction(location: string, formData: FormData) {
  await requireAdmin("ADMIN");
  if (!isLocation(location)) return done("Geçersiz menü konumu.");
  const parsed = itemSchema.safeParse({ label: formData.get("label"), url: formData.get("url") });
  if (!parsed.success) return done(parsed.error.issues[0]?.message);

  const last = await prisma.navigationItem.findFirst({ where: { location, parentId: null }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  await prisma.navigationItem.create({ data: { location, parentId: null, ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  return done();
}

export async function updateItemAction(id: string, formData: FormData) {
  await requireAdmin("ADMIN");
  const parsed = itemSchema.safeParse({ label: formData.get("label"), url: formData.get("url") });
  if (!parsed.success) return done(parsed.error.issues[0]?.message);
  await prisma.navigationItem.update({ where: { id }, data: { ...parsed.data, active: formData.get("active") === "on" } });
  return done();
}

export async function deleteItemAction(id: string) {
  await requireAdmin("ADMIN");
  await prisma.navigationItem.delete({ where: { id } });
  return done();
}

/** Aynı konumda bir basamak yukarı/aşağı taşır; sıra numaraları 0..n-1 olarak yeniden yazılır. */
export async function moveItemAction(id: string, direction: "up" | "down") {
  await requireAdmin("ADMIN");
  const item = await prisma.navigationItem.findUnique({ where: { id }, select: { location: true } });
  if (!item) return done();

  const siblings = await prisma.navigationItem.findMany({
    where: { location: item.location, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true },
  });
  const index = siblings.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= siblings.length) return done();

  const ids = siblings.map((s) => s.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  await prisma.$transaction(ids.map((sid, i) => prisma.navigationItem.update({ where: { id: sid }, data: { sortOrder: i } })));
  return done();
}

/** Bir konumun varsayılan bağlantılarını düzenlenebilir kayıt olarak içe aktarır (yalnızca o konumda kayıt yokken). */
export async function importDefaultsAction(location: string) {
  await requireAdmin("ADMIN");
  if (!isLocation(location)) return done("Geçersiz menü konumu.");
  if ((await prisma.navigationItem.count({ where: { location } })) > 0) return done();

  await prisma.navigationItem.createMany({
    data: DEFAULT_NAV[location].map((item, i) => ({ location, label: item.label, url: item.href, sortOrder: i, active: true })),
  });
  return done();
}
