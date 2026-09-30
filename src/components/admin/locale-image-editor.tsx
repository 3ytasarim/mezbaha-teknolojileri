"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaPicker } from "./media-picker";

export type LocaleImageOption = { code: string; label: string };
export type LocaleImageValues = { coverImage: string; gallery: { baseImageUrl: string; imageUrl: string }[] };

/**
 * Üzerinde yazı olan kapak/galeri görselleri için dile özgü görsel yükleme: her sekme (dil) kendi kapak görselini
 * ve mevcut galerideki her fotoğraf için dile özgü bir alternatif yükleyebilir. Boş bırakılırsa Türkçe (ortak)
 * görsel kullanılır — bu yüzden burada "sil/ekle/sırala" yok, sadece Türkçe galerideki her konum için opsiyonel
 * bir üst üste yazma (override) var. Eşleme index'e değil görsel URL'sine göre yapılır (adı `galleryOverride_<dil>_<url>`),
 * böylece Türkçe galeri daha sonra yeniden sıralansa bile eşleşme bozulmaz.
 */
export function LocaleImageEditor({
  locales,
  baseGallery,
  initialValues,
}: {
  locales: LocaleImageOption[];
  baseGallery: { url: string; alt: string }[];
  initialValues: Partial<Record<string, LocaleImageValues>>;
}) {
  const [active, setActive] = useState(locales[0]?.code ?? "");

  if (locales.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Bu ürünün henüz çevirisi yok — dile özgü görsel eklemek için önce Çeviriler sayfasından çeviri oluşturun.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setActive(l.code)}
            className={`h-9 rounded-md border px-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active === l.code
                ? "border-neutral-100 bg-neutral-100 text-neutral-900"
                : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {locales.map((l) => {
        const values = initialValues[l.code];
        const overrideMap = new Map((values?.gallery ?? []).map((g) => [g.baseImageUrl, g.imageUrl]));
        return (
          <div key={l.code} className={active === l.code ? "flex flex-col gap-6" : "hidden"}>
            <div className="rounded-md border border-neutral-800 p-4">
              <p className="mb-3 text-xs text-neutral-500">
                Boş bırakılırsa Türkçe kapak görseli kullanılır. Sadece üzerinde bu dilde yazı olan farklı bir görsel varsa yükleyin.
              </p>
              <MediaPicker name={`coverImage_${l.code}`} label={`Kapak Görseli (${l.label})`} initialUrl={values?.coverImage} />
            </div>

            {baseGallery.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-neutral-200">Galeri ({l.label})</p>
                {baseGallery.map((item, i) => (
                  <div
                    key={`${item.url}-${i}`}
                    className="flex flex-col gap-2 rounded-md border border-neutral-800 p-3 sm:flex-row sm:items-start"
                  >
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md bg-neutral-900">
                        <Image src={item.url} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                      <span className="text-[10px] text-neutral-500">Türkçe</span>
                    </div>
                    <div className="flex-1">
                      <MediaPicker
                        name={`galleryOverride_${l.code}__${encodeURIComponent(item.url)}`}
                        label={`${i + 1}. görsel için ${l.label} alternatifi (opsiyonel)`}
                        initialUrl={overrideMap.get(item.url)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
