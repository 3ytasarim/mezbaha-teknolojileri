"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { buildDefaultSlides } from "@/lib/hero-slides";

const slideSchema = z.object({
  title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı.").max(140),
  subtitle: z.string().trim().max(400).optional(),
  buttonText: z.string().trim().min(2, "Buton yazısı en az 2 karakter olmalı.").max(40),
  buttonLink: z
    .string()
    .trim()
    .min(1, "Buton bağlantısı gerekli.")
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Bağlantı / ile (site içi) veya https:// ile başlamalı."),
  image: z.string().trim().min(1, "Slayt görseli seçin."),
  imageAlt: z.string().trim().max(160).optional(),
  fit: z.enum(["cover", "contain"]),
  active: z.coerce.boolean().default(true),
});

export type SlideFormState = { error?: string };

function parseForm(formData: FormData) {
  return slideSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    buttonText: formData.get("buttonText"),
    buttonLink: formData.get("buttonLink"),
    image: formData.get("image") ?? "",
    imageAlt: formData.get("imageAlt") || undefined,
    fit: formData.get("fit") === "contain" ? "contain" : "cover",
    active: formData.get("active") === "on",
  });
}

function refresh() {
  revalidatePath("/admin/slider");
  revalidatePath("/");
}

export async function createSlideAction(_prev: SlideFormState, formData: FormData): Promise<SlideFormState> {
  await requireAdmin("EDITOR");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  const last = await prisma.heroSlide.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  await prisma.heroSlide.create({ data: { ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 } });

  refresh();
  redirect("/admin/slider");
}

export async function updateSlideAction(id: string, _prev: SlideFormState, formData: FormData): Promise<SlideFormState> {
  await requireAdmin("EDITOR");
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form geçersiz." };

  await prisma.heroSlide.update({ where: { id }, data: parsed.data });

  refresh();
  redirect("/admin/slider");
}

export async function deleteSlideAction(id: string) {
  await requireAdmin("EDITOR");
  await prisma.heroSlide.delete({ where: { id } });
  refresh();
}

export async function toggleSlideAction(id: string) {
  await requireAdmin("EDITOR");
  const slide = await prisma.heroSlide.findUnique({ where: { id }, select: { active: true } });
  if (!slide) return;
  await prisma.heroSlide.update({ where: { id }, data: { active: !slide.active } });
  refresh();
}

/** Sırayı bir basamak yukarı/aşağı taşır (komşuyla sortOrder değişimi). */
export async function moveSlideAction(id: string, direction: "up" | "down") {
  await requireAdmin("EDITOR");
  const slides = await prisma.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const index = slides.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= slides.length) return;

  const ids = slides.map((s) => s.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  // Sıra numaralarını baştan 0..n-1 olarak yaz (eşit sortOrder çakışmalarını da giderir)
  await prisma.$transaction(ids.map((sid, i) => prisma.heroSlide.update({ where: { id: sid }, data: { sortOrder: i } })));
  refresh();
}

/** Sitenin şu an gösterdiği varsayılan slaytları düzenlenebilir kayıtlar olarak içe aktarır (yalnızca liste boşken). */
export async function importDefaultSlidesAction() {
  await requireAdmin("EDITOR");
  if ((await prisma.heroSlide.count()) > 0) return;

  const defaults = await buildDefaultSlides();
  await prisma.heroSlide.createMany({
    data: defaults.map((slide, i) => ({
      title: slide.title,
      subtitle: slide.subtitle ?? null,
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      image: slide.image,
      imageAlt: slide.imageAlt,
      fit: slide.fit,
      sortOrder: i,
      active: true,
    })),
  });
  refresh();
}
