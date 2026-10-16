"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { sendNotificationEmail, fieldsToHtml } from "@/lib/mail";

/**
 * Teklif talebi formu: doğrulama (Zod) + spam koruması (bal küpü, aynı e-postadan saatte en fazla 3, tüm sitede saatte en
 * fazla 30) + veritabanına kayıt (QuoteRequest → Admin > Talepler > Teklif Talepleri) + e-posta bildirimi
 * (CONTACT_NOTIFY_EMAIL). E-posta gönderimi başarısız olsa bile form yine başarılı sayılır — veri DB'de güvende.
 */
const PROJECT_TYPES = ["Yeni mezbaha kurulumu", "Mevcut tesise ekipman", "Modernizasyon / yenileme", "Diğer"] as const;

const makeSchema = (e: { name: string; company: string; email: string; phone: string; country: string; message: string; consent: string }) =>
  z.object({
    name: z.string().trim().min(2, e.name).max(120),
    company: z.string().trim().min(2, e.company).max(160),
    email: z.string().trim().email(e.email).max(200),
    phone: z.string().trim().min(6, e.phone).max(40),
    country: z.string().trim().min(2, e.country).max(80),
    productId: z.string().max(60).optional(),
    projectType: z.enum(PROJECT_TYPES).optional(),
    capacity: z.string().trim().max(120).optional(),
    message: z.string().trim().min(10, e.message).max(4000),
    consent: z.literal("on", { message: e.consent }),
  });

export type QuoteFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "company" | "email" | "phone" | "country" | "message" | "consent", string>>;
};

const clean = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
};

export async function submitQuoteAction(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const { d } = await getI18n();
  const f = d.forms;
  const schema = makeSchema(f.errors);
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: f.quoteReceived };
  }

  const parsed = schema.safeParse({
    name: clean(formData.get("name")),
    company: clean(formData.get("company")),
    email: clean(formData.get("email")),
    phone: clean(formData.get("phone")),
    country: clean(formData.get("country")),
    productId: clean(formData.get("productId")),
    projectType: clean(formData.get("projectType")),
    capacity: clean(formData.get("capacity")),
    message: clean(formData.get("message")),
    consent: formData.get("consent") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: NonNullable<QuoteFormState["fieldErrors"]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: f.errors.check, fieldErrors };
  }

  const { consent: _consent, productId, ...data } = parsed.data;
  void _consent;

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [sameEmail, total] = await Promise.all([
    prisma.quoteRequest.count({ where: { email: data.email, createdAt: { gte: since } } }),
    prisma.quoteRequest.count({ where: { createdAt: { gte: since } } }),
  ]);
  if (sameEmail >= 3 || total >= 30) {
    return { status: "error", message: f.quoteRateLimit };
  }

  // Ürün yalnızca gerçekten var olan yayınlı bir ürünse bağlanır
  const product = productId
    ? await prisma.product.findFirst({
        where: { id: productId, status: "PUBLISHED" },
        select: { id: true, translations: { where: { locale: "tr" }, select: { name: true } } },
      })
    : null;

  try {
    await prisma.quoteRequest.create({ data: { ...data, productId: product?.id } });
  } catch {
    return { status: "error", message: f.quoteFailed };
  }

  try {
    await sendNotificationEmail({
      subject: `Yeni teklif talebi: ${data.company}`,
      html: fieldsToHtml("Yeni Teklif Talebi", [
        { label: "Ad Soyad", value: data.name },
        { label: "Firma", value: data.company },
        { label: "E-posta", value: data.email },
        { label: "Telefon", value: data.phone },
        { label: "Ülke", value: data.country },
        { label: "Ürün", value: product?.translations[0]?.name },
        { label: "Proje Tipi", value: data.projectType },
        { label: "Kapasite", value: data.capacity },
        { label: "Mesaj", value: data.message },
      ]),
      replyTo: data.email,
    });
  } catch (err) {
    console.error("Teklif talebi bildirim e-postası gönderilemedi:", err);
  }

  return { status: "success", message: f.quoteSuccess };
}
