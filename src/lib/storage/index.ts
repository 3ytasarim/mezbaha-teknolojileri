import type { StorageProvider } from "./types";
import { localStorageProvider } from "./local";
import { s3StorageProvider } from "./s3";

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "local":
      return localStorageProvider;
    case "s3":
      return s3StorageProvider;
    default:
      throw new Error(`STORAGE_PROVIDER="${provider}" desteklenmiyor. Geçerli değerler: "local", "s3".`);
  }
}

export const storage = createStorageProvider();
export type { StorageProvider } from "./types";
