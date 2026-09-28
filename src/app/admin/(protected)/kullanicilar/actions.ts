"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import type { AdminRole } from "@prisma/client";

const MIN_PASSWORD = 12;

const baseSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(120),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin.").max(200),
  role: z.enum(["EDITOR", "ADMIN", "SUPERADMIN"]),
  active: z.coerce.boolean().default(true),
});

const passwordSchema = z.string().min(MIN_PASSWORD, `Şifre en az ${MIN_PASSWORD} karakter olmalı.`).max(200);

export type UserFormState = { error?: string };

function parseBase(formData: FormData) {
  return baseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    active: formData.get("active") === "on",
  });
}

function refresh() {
  revalidatePath("/admin/kullanicilar");
}

/** Sistemde başka en az bir AKTİF süper admin kalıyor mu? (kilitlenmeyi önler) */
async function otherActiveSuperadmins(excludeId: string) {
  return prisma.adminUser.count({ where: { role: "SUPERADMIN", active: true, id: { not: excludeId } } });
}

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireAdmin("SUPERADMIN");
  const parsed = parseBase(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0]?.message ?? "Şifre geçersiz." };
  if (formData.get("password") !== formData.get("passwordConfirm")) return { error: "Şifreler eşleşmiyor." };

  if (await prisma.adminUser.findUnique({ where: { email: parsed.data.email } })) {
    return { error: "Bu e-posta ile zaten bir kullanıcı var." };
  }

  await prisma.adminUser.create({
    data: { ...parsed.data, passwordHash: await hashPassword(password.data) },
  });

  refresh();
  redirect("/admin/kullanicilar");
}

export async function updateUserAction(id: string, _prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const me = await requireAdmin("SUPERADMIN");
  const parsed = parseBase(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { error: "Kullanıcı bulunamadı." };

  const emailOwner = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.id !== id) return { error: "Bu e-posta başka bir kullanıcıda kayıtlı." };

  // Kendi hesabının rolünü düşürmek veya kendini pasif yapmak yasak (panelden kilitlenmemek için)
  if (id === me.id && (parsed.data.role !== target.role || !parsed.data.active)) {
    return { error: "Kendi rolünüzü değiştiremez veya kendi hesabınızı pasif yapamazsınız." };
  }
  if (target.role === "SUPERADMIN" && (parsed.data.role !== "SUPERADMIN" || !parsed.data.active) && (await otherActiveSuperadmins(id)) === 0) {
    return { error: "Sistemde en az bir aktif süper admin kalmalı." };
  }

  const newPassword = String(formData.get("password") ?? "");
  const data: { name: string; email: string; role: AdminRole; active: boolean; passwordHash?: string } = { ...parsed.data };
  if (newPassword) {
    const pw = passwordSchema.safeParse(newPassword);
    if (!pw.success) return { error: pw.error.issues[0]?.message ?? "Şifre geçersiz." };
    if (newPassword !== formData.get("passwordConfirm")) return { error: "Şifreler eşleşmiyor." };
    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.adminUser.update({ where: { id }, data });

  // Şifre değiştiyse veya hesap pasif yapıldıysa açık oturumlar sonlandırılır (kendi oturumu hariç)
  if ((newPassword || !parsed.data.active) && id !== me.id) {
    await prisma.session.deleteMany({ where: { adminUserId: id } });
  }

  refresh();
  redirect("/admin/kullanicilar");
}

export async function deleteUserAction(id: string) {
  const me = await requireAdmin("SUPERADMIN");
  if (id === me.id) throw new Error("Kendi hesabınızı silemezsiniz.");

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return;
  if (target.role === "SUPERADMIN" && (await otherActiveSuperadmins(id)) === 0) {
    throw new Error("Sistemde en az bir aktif süper admin kalmalı.");
  }

  await prisma.adminUser.delete({ where: { id } });
  refresh();
}
