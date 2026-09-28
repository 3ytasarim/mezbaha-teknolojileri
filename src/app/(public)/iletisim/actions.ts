"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";

/**
 * İletişim formu: doğrulama (Zod) + spam koruması (bal küpü alanı, aynı e-postadan saatte en fazla 3, tüm sitede saatte
 * en fazla 30 kayıt) + veritabanına kayıt (ContactSubmission → Admin > Talepler > İletişim). E-posta bildirimi yoktur;
 * mesajlar yönetim panelinde görünür.
 */
const makeSchema = (e: { name: string; email: string; message: string; messageMax: string; consent: string }) =>
  z.object({
    name: z.string().trim().min(2, e.name).max(120),
    email: z.string().trim().email(e.email).max(200),
    phone: z.string().trim().max(40).optional(),
    company: z.string().trim().max(160).optional(),
    subject: z.string().trim().max(160).optional(),
    message: z.string().trim().min(10, e.message).max(4000, e.messageMax),
    consent: z.literal("on", { message: e.consent }),
  });

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message" | "consent", string>>;
};

const clean = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
};

export async function submitContactAction(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const { d } = await getI18n();
  const f = d.forms;
  const schema = makeSchema(f.errors);
  // Bal küpü: gerçek kullanıcı bu gizli alanı doldurmaz. Botlara başarılı gibi yanıt verilir, kayıt yapılmaz.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: f.contactReceived };
  }

  const parsed = schema.safeParse({
    name: clean(formData.get("name")),
    email: clean(formData.get("email")),
    phone: clean(formData.get("phone")),
    company: clean(formData.get("company")),
    subject: clean(formData.get("subject")),
    message: clean(formData.get("message")),
    consent: formData.get("consent") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: NonNullable<ContactFormState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: f.errors.check, fieldErrors };
  }

  const { consent: _consent, ...data } = parsed.data;
  void _consent;

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [sameEmail, total] = await Promise.all([
    prisma.contactSubmission.count({ where: { email: data.email, createdAt: { gte: since } } }),
    prisma.contactSubmission.count({ where: { createdAt: { gte: since } } }),
  ]);
  if (sameEmail >= 3 || total >= 30) {
    return { status: "error", message: f.contactRateLimit };
  }

  try {
    await prisma.contactSubmission.create({ data });
  } catch {
    return { status: "error", message: f.contactFailed };
  }

  return { status: "success", message: f.contactSuccess };
}
