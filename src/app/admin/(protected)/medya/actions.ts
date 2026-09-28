"use server";

import { randomBytes } from "crypto";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth/guard";
import { findMediaUsage } from "@/lib/media";
import { slugify } from "@/lib/slug";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export type UploadMediaState = {
  error?: string;
  media?: {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    alt: string | null;
    fileSize: number;
  };
};

export async function uploadMediaAction(
  _prev: UploadMediaState,
  formData: FormData
): Promise<UploadMediaState> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bir dosya seçin." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Dosya boyutu 8MB sınırını aşıyor." };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "Desteklenmeyen dosya türü. İzin verilenler: JPEG, PNG, WebP, GIF, PDF." };
  }

  const ext = path.extname(file.name).toLowerCase() || "";
  const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : "";
  // SEO dostu dosya adı: özgün adın slug'ı + kısa rastgele ek (çakışmayı önler). Örn. dairesel-kesim-hucresi-a1b2c3d4.webp
  const baseName = slugify(path.basename(file.name, ext)).slice(0, 60) || "gorsel";
  const key = `${baseName}-${randomBytes(4).toString("hex")}${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storageKey, url } = await storage.upload({
    key,
    data: buffer,
    contentType: file.type,
  });

  const media = await prisma.media.create({
    data: {
      filename: key,
      originalName: file.name,
      mimeType: file.type,
      url,
      storageKey,
      fileSize: file.size,
    },
  });

  revalidatePath("/admin/medya");

  return {
    media: {
      id: media.id,
      url: media.url,
      filename: media.originalName,
      mimeType: media.mimeType,
      alt: media.alt,
      fileSize: media.fileSize,
    },
  };
}

export async function listMediaAction() {
  await requireAdmin();

  return prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      url: true,
      originalName: true,
      mimeType: true,
      alt: true,
    },
  });
}

export async function updateMediaAltAction(id: string, alt: string) {
  await requireAdmin();
  await prisma.media.update({ where: { id }, data: { alt } });
  revalidatePath("/admin/medya");
}

/** Medya kütüphanesindeki alt metin formu (görsel açıklaması; SEO ve erişilebilirlik). */
export async function saveMediaAltAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 160);
  if (!id) return;
  await prisma.media.update({ where: { id }, data: { alt: alt || null } });
  revalidatePath("/admin/medya");
}

export async function deleteMediaAction(id: string) {
  await requireAdmin();

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;

  const usages = await findMediaUsage(media.url);
  if (usages.length > 0) {
    throw new Error(
      `Bu görsel kullanımda olduğu için silinemiyor: ${usages.join(", ")}.`
    );
  }

  await storage.delete(media.storageKey);
  await prisma.media.delete({ where: { id } });

  revalidatePath("/admin/medya");
}

export type DeleteMediaState = { error?: string; done?: boolean };

export async function deleteMediaWithStateAction(id: string): Promise<DeleteMediaState> {
  try {
    await deleteMediaAction(id);
    return { done: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Silinemedi." };
  }
}
