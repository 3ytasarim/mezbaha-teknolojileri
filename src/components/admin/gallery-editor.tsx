"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { inputClass } from "./form-field";
import { listMediaAction } from "@/app/admin/(protected)/medya/actions";

type MediaItem = { id: string; url: string; originalName: string; mimeType: string; alt: string | null };

export type GalleryItem = {
  url: string;
  alt: string;
  caption: string;
};

export function GalleryEditor({
  name,
  initialItems,
}: {
  name: string;
  initialItems: GalleryItem[];
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [pendingUrl, setPendingUrl] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<MediaItem[] | null>(null);
  const [, startTransition] = useTransition();

  function openLibrary() {
    setLibraryOpen((open) => !open);
    if (!library) {
      startTransition(async () => {
        const list = await listMediaAction();
        setLibrary(list);
      });
    }
  }

  function update(index: number, patch: Partial<GalleryItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addFromUrl() {
    if (!pendingUrl.trim()) return;
    setItems((prev) => [...prev, { url: pendingUrl.trim(), alt: "", caption: "" }]);
    setPendingUrl("");
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.map((item, index) => (
        <div
          key={`${item.url}-${index}`}
          className="flex flex-col gap-2 rounded-md border border-neutral-800 p-3 sm:flex-row sm:items-start"
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-900">
            {item.url && <Image src={item.url} alt="" fill sizes="80px" className="object-cover" />}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <input
              value={item.alt}
              onChange={(e) => update(index, { alt: e.target.value })}
              placeholder="Alt metin (görseli açıklayan Türkçe metin)"
              className={inputClass}
            />
            <input
              value={item.caption}
              onChange={(e) => update(index, { caption: e.target.value })}
              placeholder="Açıklama (opsiyonel)"
              className={inputClass}
            />
          </div>
          <div className="flex shrink-0 gap-1.5 sm:flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              className="h-8 w-8 rounded-md border border-neutral-700 text-xs text-neutral-300"
              aria-label="Yukarı taşı"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              className="h-8 w-8 rounded-md border border-neutral-700 text-xs text-neutral-300"
              aria-label="Aşağı taşı"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(index)}
              className="h-8 w-8 rounded-md border border-neutral-700 text-xs text-red-400"
              aria-label="Kaldır"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <input
          value={pendingUrl}
          onChange={(e) => setPendingUrl(e.target.value)}
          placeholder="veya medya URL'si yapıştırın"
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={addFromUrl}
          className="h-11 rounded-md border border-neutral-700 px-4 text-sm text-neutral-200"
        >
          Ekle
        </button>
        <button
          type="button"
          onClick={openLibrary}
          className="h-11 rounded-md border border-neutral-700 px-4 text-sm text-neutral-200"
        >
          Kütüphaneden Seç
        </button>
      </div>

      {libraryOpen && (
        <div className="max-h-72 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-950 p-3">
          {!library && <p className="text-xs text-neutral-500">Yükleniyor...</p>}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {library
              ?.filter((item) => item.mimeType.startsWith("image/"))
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    // Kütüphanede kayıtlı alt metin varsa otomatik gelsin — boşsa admin galeride kendisi yazar.
                    setItems((prev) => [...prev, { url: item.url, alt: item.alt ?? "", caption: "" }]);
                    setLibraryOpen(false);
                  }}
                  className="flex flex-col overflow-hidden rounded-md border border-neutral-800 text-start hover:border-neutral-400"
                  title={item.originalName}
                >
                  <div className="relative aspect-square shrink-0">
                    <Image src={item.url} alt="" fill sizes="120px" className="object-cover" />
                  </div>
                  <p className={`truncate px-1.5 py-1 text-[10px] leading-tight ${item.alt ? "text-neutral-400" : "text-amber-400"}`}>
                    {item.alt || "Alt metin yok"}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
