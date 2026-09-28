"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import {
  listMediaAction,
  uploadMediaAction,
  type UploadMediaState,
} from "@/app/admin/(protected)/medya/actions";

type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  alt: string | null;
};

const initialUploadState: UploadMediaState = {};

export function MediaPicker({
  name,
  label,
  initialUrl,
  altName,
  initialAlt,
  altSuggestion,
}: {
  name: string;
  label: string;
  initialUrl?: string | null;
  /** Verilirse görselin altına "Alt metin" alanı eklenir ve bu adla forma gönderilir (SEO + erişilebilirlik) */
  altName?: string;
  initialAlt?: string | null;
  /** Alt metin boşsa sitede kullanılacak varsayılan (ör. ürün adı) */
  altSuggestion?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [alt, setAlt] = useState(initialAlt ?? "");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<MediaItem[] | null>(null);
  const [loadingLibrary, startLibraryTransition] = useTransition();
  const [, startUploadTransition] = useTransition();
  const [uploadState, uploadAction, uploadPending] = useActionState(
    async (_prev: UploadMediaState, formData: FormData) => {
      const result = await uploadMediaAction(_prev, formData);
      if (result.media) {
        setUrl(result.media.url);
      }
      return result;
    },
    initialUploadState
  );

  function openLibrary() {
    setLibraryOpen((open) => !open);
    if (!library) {
      startLibraryTransition(async () => {
        const items = await listMediaAction();
        setLibrary(items);
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-neutral-200">{label}</p>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative h-32 w-32 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900">
          <Image src={url} alt="" fill sizes="128px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-md border border-dashed border-neutral-700 text-xs text-neutral-500">
          Görsel yok
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="h-9 cursor-pointer rounded-md border border-neutral-700 px-3 text-xs font-medium leading-9 text-neutral-200 hover:bg-neutral-900">
          {uploadPending ? "Yükleniyor..." : "Yeni Yükle"}
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
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

        <button
          type="button"
          onClick={openLibrary}
          className="h-9 rounded-md border border-neutral-700 px-3 text-xs font-medium text-neutral-200 hover:bg-neutral-900"
        >
          Kütüphaneden Seç
        </button>

        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="h-9 rounded-md border border-neutral-700 px-3 text-xs font-medium text-red-400 hover:bg-neutral-900"
          >
            Kaldır
          </button>
        )}
      </div>

      {altName && url && (
        <div className="flex max-w-md flex-col gap-1.5">
          <label htmlFor={altName} className="text-sm font-medium text-neutral-200">
            Görsel alt metni (SEO)
          </label>
          <input
            id={altName}
            name={altName}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={160}
            placeholder={altSuggestion ? `Boşsa: ${altSuggestion}` : "Görselde ne var? Kısa ve açıklayıcı yazın"}
            className="h-11 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none focus:border-neutral-400"
          />
          <p className="text-xs text-neutral-500">
            Görseli görmeyenler (ekran okuyucu) ve arama motorları için. Anahtar kelime listesi yazmayın; kısa bir cümle yeterli. Örn. &ldquo;Paslanmaz çelik dairesel kesim hücresi&rdquo;.
          </p>
        </div>
      )}
      {altName && !url && <input type="hidden" name={altName} value="" />}

      {uploadState.error && (
        <p role="alert" className="text-xs text-red-400">
          {uploadState.error}
        </p>
      )}

      {libraryOpen && (
        <div className="max-h-64 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-950 p-3">
          {loadingLibrary && !library && (
            <p className="text-xs text-neutral-500">Yükleniyor...</p>
          )}
          {library && library.length === 0 && (
            <p className="text-xs text-neutral-500">Medya kütüphanesi boş.</p>
          )}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {library?.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setUrl(item.url);
                  if (altName && !alt && item.alt) setAlt(item.alt);
                  setLibraryOpen(false);
                }}
                className="relative aspect-square overflow-hidden rounded-md border border-neutral-800 hover:border-neutral-400"
                title={item.originalName}
              >
                {item.mimeType.startsWith("image/") ? (
                  <Image src={item.url} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                    PDF
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
