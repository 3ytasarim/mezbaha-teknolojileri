import "server-only";
import { cache } from "react";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { CONTACT } from "@/content/site";

/**
 * Site ayarları: iletişim bilgileri Admin > Sistem > Site Ayarları'ndan yönetilir (SiteSetting tablosu, anahtar "contact",
 * JSON). Kayıt yoksa veya bozuksa kodda tanımlı varsayılanlar (content/site.ts) kullanılır — site hiçbir zaman boş kalmaz.
 * "WhatsApp" etiketli telefon satırı WhatsApp numarası olarak kullanılır.
 */
export const CONTACT_SETTING_KEY = "contact";

const entry = z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(3).max(60) });

export const contactSettingsSchema = z.object({
  phones: z.array(entry).min(1).max(10),
  emails: z.array(entry).min(1).max(6),
  address: z.object({
    line1: z.string().trim().min(2).max(200),
    line2: z.string().trim().min(2).max(200),
    locality: z.string().trim().min(2).max(120),
    country: z.string().trim().min(2).max(2).default("TR"),
  }),
});

export type ContactSettings = z.infer<typeof contactSettingsSchema>;

export const DEFAULT_CONTACT: ContactSettings = {
  phones: CONTACT.phones.map((p) => ({ label: p.label, value: p.value })),
  emails: CONTACT.emails.map((e) => ({ label: e.label, value: e.value })),
  address: { ...CONTACT.address },
};

/** İstek başına tek DB okuması (React cache). */
export const getContactSettings = cache(async (): Promise<ContactSettings> => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CONTACT_SETTING_KEY } });
    if (!row) return DEFAULT_CONTACT;
    const parsed = contactSettingsSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : DEFAULT_CONTACT;
  } catch {
    return DEFAULT_CONTACT;
  }
});

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** WhatsApp numarası: "WhatsApp" etiketli telefon satırı. */
export function whatsappOf(contact: ContactSettings) {
  const found = contact.phones.find((p) => p.label.toLocaleLowerCase("tr") === "whatsapp");
  const display = found?.value ?? "";
  const digits = onlyDigits(display);
  return { display, digits, tel: digits ? `tel:+${digits}` : "" };
}
