import type { StorageProvider } from "./types";
import { localStorageProvider } from "./local";

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      return localStorageProvider;
    default:
      throw new Error(
        `STORAGE_PROVIDER="${provider}" desteklenmiyor. Şu an yalnızca "local" implementasyonu mevcut; ` +
          `S3-uyumlu (STORAGE_ENDPOINT/STORAGE_BUCKET/...) implementasyon ileride eklenecektir.`
      );
  }
}

export const storage = createStorageProvider();
export type { StorageProvider } from "./types";
