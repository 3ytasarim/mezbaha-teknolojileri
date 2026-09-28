"use client";

import { useActionState } from "react";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaPicker } from "@/components/admin/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { PageFormState } from "./actions";

type Values = {
  title: string;
  slug: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
};

export function PageForm({
  action,
  initialValues,
}: {
  action: (state: PageFormState, formData: FormData) => Promise<PageFormState>;
  initialValues?: Values;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      <FormField label="Başlık" htmlFor="title">
        <input id="title" name="title" defaultValue={initialValues?.title} required className={inputClass} />
      </FormField>

      <FormField label="Slug" htmlFor="slug" hint="Sayfa adresi: /hizmetler/<slug>. Boş bırakılırsa başlıktan üretilir.">
        <input id="slug" name="slug" defaultValue={initialValues?.slug} className={inputClass} />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-neutral-200">İçerik</p>
        <RichTextEditor name="content" initialValue={initialValues?.content} />
      </div>

      <FormField label="Durum" htmlFor="status" hint="Yalnızca Yayında olan sayfalar sitede görünür.">
        <select id="status" name="status" defaultValue={initialValues?.status ?? "DRAFT"} className={selectClass}>
          <option value="DRAFT">Taslak</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="ARCHIVED">Arşivlendi</option>
        </select>
      </FormField>

      <div className="flex flex-col gap-4 border-t border-neutral-800 pt-6">
        <h2 className="text-sm font-semibold text-neutral-300">SEO</h2>
        <FormField label="SEO Başlığı" htmlFor="seoTitle" hint="Boşsa sayfa başlığı kullanılır.">
          <input id="seoTitle" name="seoTitle" defaultValue={initialValues?.seoTitle} className={inputClass} />
        </FormField>
        <FormField label="SEO Açıklaması" htmlFor="seoDescription" hint="Arama sonuçlarında görünen özet (yaklaşık 150 karakter).">
          <textarea id="seoDescription" name="seoDescription" defaultValue={initialValues?.seoDescription} rows={2} className={textareaClass} />
        </FormField>
        <MediaPicker name="ogImage" label="Paylaşım görseli (OG)" initialUrl={initialValues?.ogImage} />
      </div>

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
