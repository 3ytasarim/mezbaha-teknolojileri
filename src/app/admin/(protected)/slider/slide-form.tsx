"use client";

import { useActionState } from "react";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaPicker } from "@/components/admin/media-picker";
import type { SlideFormState } from "./actions";

type SlideFormValues = {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  imageAlt: string;
  fit: "cover" | "contain";
  active: boolean;
};

export function SlideForm({
  action,
  initialValues,
}: {
  action: (state: SlideFormState, formData: FormData) => Promise<SlideFormState>;
  initialValues?: SlideFormValues;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormField label="Başlık" htmlFor="title" hint="Slaytta iri yazılan ana başlık.">
        <input id="title" name="title" defaultValue={initialValues?.title} required className={inputClass} />
      </FormField>

      <FormField label="Alt yazı" htmlFor="subtitle" hint="İsteğe bağlı. Başlığın altındaki kısa açıklama.">
        <textarea id="subtitle" name="subtitle" defaultValue={initialValues?.subtitle} rows={3} className={textareaClass} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Buton yazısı" htmlFor="buttonText">
          <input id="buttonText" name="buttonText" defaultValue={initialValues?.buttonText ?? "Ürünleri İncele"} required className={inputClass} />
        </FormField>
        <FormField label="Buton bağlantısı" htmlFor="buttonLink" hint="Site içi: /urunler, /urun/urun-adi. Dış: https://…">
          <input id="buttonLink" name="buttonLink" defaultValue={initialValues?.buttonLink ?? "/urunler"} required className={inputClass} />
        </FormField>
      </div>

      <MediaPicker name="image" label="Slayt görseli" initialUrl={initialValues?.image} />

      <FormField label="Görsel açıklaması (alt metin)" htmlFor="imageAlt" hint="Ekran okuyucular ve SEO için. Boşsa başlık kullanılır.">
        <input id="imageAlt" name="imageAlt" defaultValue={initialValues?.imageAlt} className={inputClass} />
      </FormField>

      <FormField
        label="Görsel yerleşimi"
        htmlFor="fit"
        hint="Fotoğraf: görsel sağ yarıyı doldurur (kenarlar kırpılabilir). Ürün görseli: görsel kırpılmadan tam gösterilir."
      >
        <select id="fit" name="fit" defaultValue={initialValues?.fit ?? "cover"} className={selectClass}>
          <option value="cover">Fotoğraf (doldur)</option>
          <option value="contain">Ürün görseli (kırpma)</option>
        </select>
      </FormField>

      <label className="flex items-center gap-2 text-sm text-neutral-200">
        <input type="checkbox" name="active" defaultChecked={initialValues?.active ?? true} className="h-4 w-4" />
        Aktif (sitede göster)
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton label="Kaydet" />
      </div>
    </form>
  );
}
