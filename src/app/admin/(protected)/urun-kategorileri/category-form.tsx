"use client";

import { useActionState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaPicker } from "@/components/admin/media-picker";
import type { CategoryFormState } from "./actions";

type CategoryFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  image: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
};

export function CategoryForm({
  action,
  initialValues,
}: {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  initialValues?: CategoryFormValues;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormField label="Ad" htmlFor="name">
        <input
          id="name"
          name="name"
          defaultValue={initialValues?.name}
          required
          className={inputClass}
        />
      </FormField>

      <FormField label="Slug" htmlFor="slug" hint="Boş bırakılırsa isimden otomatik üretilir.">
        <input id="slug" name="slug" defaultValue={initialValues?.slug} className={inputClass} />
      </FormField>

      <FormField label="Kısa Açıklama" htmlFor="shortDescription">
        <textarea
          id="shortDescription"
          name="shortDescription"
          defaultValue={initialValues?.shortDescription}
          rows={2}
          className={textareaClass}
        />
      </FormField>

      <FormField label="Açıklama" htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description}
          rows={5}
          className={textareaClass}
        />
      </FormField>

      <MediaPicker name="image" label="Kategori Görseli" initialUrl={initialValues?.image} />

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Sıra" htmlFor="sortOrder">
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={initialValues?.sortOrder ?? 0}
            className={inputClass}
          />
        </FormField>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              name="active"
              defaultChecked={initialValues?.active ?? true}
              className="h-4 w-4"
            />
            Aktif
          </label>
        </div>
      </div>

      <div className="border-t border-neutral-800 pt-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-300">SEO</h2>
        <div className="flex flex-col gap-4">
          <FormField label="SEO Başlığı" htmlFor="seoTitle">
            <input
              id="seoTitle"
              name="seoTitle"
              defaultValue={initialValues?.seoTitle}
              className={inputClass}
            />
          </FormField>
          <FormField label="SEO Açıklaması" htmlFor="seoDescription">
            <textarea
              id="seoDescription"
              name="seoDescription"
              defaultValue={initialValues?.seoDescription}
              rows={2}
              className={textareaClass}
            />
          </FormField>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton label="Kaydet" />
      </div>
    </form>
  );
}
