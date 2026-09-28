"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { CONTACT_SETTING_KEY, contactSettingsSchema } from "@/lib/site-settings";
import { EMAIL_SLOTS, PHONE_SLOTS } from "./slots";

export type SettingsFormState = { error?: string; saved?: boolean };

function readRows(formData: FormData, prefix: string, slots: number) {
  const rows: { label: string; value: string }[] = [];
  for (let i = 0; i < slots; i++) {
    const label = String(formData.get(`${prefix}Label${i}`) ?? "").trim();
    const value = String(formData.get(`${prefix}Value${i}`) ?? "").trim();
    if (!label && !value) continue;
    rows.push({ label, value });
  }
  return rows;
}

export async function saveContactSettingsAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdmin("ADMIN");

  const parsed = contactSettingsSchema.safeParse({
    phones: readRows(formData, "phone", PHONE_SLOTS),
    emails: readRows(formData, "email", EMAIL_SLOTS),
    address: {
      line1: String(formData.get("line1") ?? ""),
      line2: String(formData.get("line2") ?? ""),
      locality: String(formData.get("locality") ?? ""),
      country: "TR",
    },
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path[0];
    const area = where === "phones" ? "Telefon" : where === "emails" ? "E-posta" : where === "address" ? "Adres" : "Form";
    return { error: `${area}: satırlarda etiket ve değer dolu olmalı, en az bir kayıt bulunmalı ve alanlar çok kısa/uzun olmamalı.` };
  }

  for (const email of parsed.data.emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return { error: `Geçersiz e-posta adresi: ${email.value}` };
  }

  const value = JSON.stringify(parsed.data);
  await prisma.siteSetting.upsert({
    where: { key: CONTACT_SETTING_KEY },
    create: { key: CONTACT_SETTING_KEY, value, type: "json" },
    update: { value, type: "json" },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/ayarlar");
  return { saved: true };
}

/** Kayıtlı ayarı siler; site kodda tanımlı varsayılan iletişim bilgilerine döner. */
export async function resetContactSettingsAction() {
  await requireAdmin("ADMIN");
  await prisma.siteSetting.deleteMany({ where: { key: CONTACT_SETTING_KEY } });
  revalidatePath("/", "layout");
  revalidatePath("/admin/ayarlar");
}
