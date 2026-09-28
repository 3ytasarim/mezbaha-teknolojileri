import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import type { StorageProvider } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const localStorageProvider: StorageProvider = {
  async upload({ key, data }) {
    await mkdir(path.dirname(path.join(UPLOAD_DIR, key)), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, key), data);
    return { storageKey: key, url: this.getPublicUrl(key) };
  },

  async delete(storageKey) {
    await unlink(path.join(UPLOAD_DIR, storageKey)).catch(() => {});
  },

  // Göreli adres: hangi port/alan adında (localhost:3700, www, apex) çalışırsa çalışsın next/image ve tarayıcı doğru çözer.
  // Mutlak adres gereken yerlerde (OG görseli, schema) sayfalar new URL(path, siteUrl) ile üretir.
  getPublicUrl(storageKey) {
    return `/uploads/${storageKey}`;
  },
};
