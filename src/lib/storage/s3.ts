import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import type { StorageProvider } from "./types";

/**
 * S3 uyumlu nesne depolama (Hetzner Object Storage vb.). Görseller özel (private) kovada tutulur; tarayıcıya
 * doğrudan kova adresi VERİLMEZ. Adresler sitenin kendi alan adında kalır (/images/..., /uploads/...) ve
 * bu yolları `serveFromBucket` (src/app/images ve src/app/uploads route'ları) kovadan okuyup sunar —
 * böylece DB'deki yollar, görsel sitemap, canonical/OG ve 301 yönlendirmeleri değişmez.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} tanımlı değil (STORAGE_PROVIDER="s3" için zorunlu).`);
  return value;
}

let client: S3Client | null = null;

export function getS3(): { client: S3Client; bucket: string } {
  if (!client) {
    client = new S3Client({
      endpoint: required("STORAGE_ENDPOINT"),
      region: process.env.STORAGE_REGION?.trim() || "us-east-1",
      credentials: { accessKeyId: required("STORAGE_ACCESS_KEY"), secretAccessKey: required("STORAGE_SECRET_KEY") },
      forcePathStyle: true,
    });
  }
  return { client, bucket: required("STORAGE_BUCKET") };
}

/** Yönetim panelinden yüklenen dosyalar kovada `uploads/` önekiyle tutulur. */
const UPLOAD_PREFIX = "uploads/";

export const s3StorageProvider: StorageProvider = {
  async upload({ key, data, contentType }) {
    const { client, bucket } = getS3();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: UPLOAD_PREFIX + key,
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return { storageKey: key, url: this.getPublicUrl(key) };
  },

  async delete(storageKey) {
    const { client, bucket } = getS3();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: UPLOAD_PREFIX + storageKey })).catch(() => {});
  },

  // Göreli adres (yerel sağlayıcıyla aynı): mevcut DB kayıtları ve next/image bozulmaz.
  getPublicUrl(storageKey) {
    return `/uploads/${storageKey}`;
  },
};

/** Kovadan tek nesne okur (koşullu ETag desteğiyle). Yoksa `null`. */
export async function getBucketObject(key: string, ifNoneMatch?: string | null): Promise<GetObjectCommandOutput | "not-modified" | null> {
  const { client, bucket } = getS3();
  try {
    return await client.send(new GetObjectCommand({ Bucket: bucket, Key: key, ...(ifNoneMatch ? { IfNoneMatch: ifNoneMatch } : {}) }));
  } catch (error) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.$metadata?.httpStatusCode === 304) return "not-modified";
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}
