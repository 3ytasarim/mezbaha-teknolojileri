"use client";

import { useActionState, useState, useTransition } from "react";
import { uploadMediaAction, type UploadMediaState } from "@/app/admin/(protected)/medya/actions";

export type DocumentItem = {
  title: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
};

const initialUploadState: UploadMediaState = {};

export function DocumentsEditor({
  name,
  initialItems,
}: {
  name: string;
  initialItems: DocumentItem[];
}) {
  const [items, setItems] = useState<DocumentItem[]>(initialItems);
  const [pendingTitle, setPendingTitle] = useState("");
  const [, startUploadTransition] = useTransition();
  const [uploadState, uploadAction, uploadPending] = useActionState(
    async (_prev: UploadMediaState, formData: FormData) => {
      const result = await uploadMediaAction(_prev, formData);
      if (result.media) {
        setItems((prev) => [
          ...prev,
          {
            title: pendingTitle.trim() || result.media!.filename,
            fileUrl: result.media!.url,
            mimeType: result.media!.mimeType,
            fileSize: result.media!.fileSize,
          },
        ]);
        setPendingTitle("");
      }
      return result;
    },
    initialUploadState
  );

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.map((item, index) => (
        <div
          key={`${item.fileUrl}-${index}`}
          className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 px-3 py-2"
        >
          <div>
            <p className="text-sm text-neutral-100">{item.title}</p>
            <p className="text-xs text-neutral-500">
              {item.mimeType} · {(item.fileSize / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="h-8 w-8 shrink-0 rounded-md border border-neutral-700 text-xs text-red-400"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={pendingTitle}
          onChange={(e) => setPendingTitle(e.target.value)}
          placeholder="Belge başlığı (örn. Teknik Föy)"
          className="h-10 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100"
        />
        <label className="h-10 cursor-pointer rounded-md border border-neutral-700 px-4 text-sm leading-10 text-neutral-200 hover:bg-neutral-900">
          {uploadPending ? "Yükleniyor..." : "PDF Yükle"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploadPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.set("file", file);
              startUploadTransition(() => uploadAction(formData));
            }}
          />
        </label>
      </div>

      {uploadState.error && (
        <p role="alert" className="text-xs text-red-400">
          {uploadState.error}
        </p>
      )}
    </div>
  );
}
