export type UploadInput = {
  key: string;
  data: Buffer;
  contentType: string;
};

export type StorageProvider = {
  upload(input: UploadInput): Promise<{ storageKey: string; url: string }>;
  delete(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
};
