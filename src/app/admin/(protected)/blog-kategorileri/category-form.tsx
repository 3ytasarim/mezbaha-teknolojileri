"use client";

import { useActionState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import type { BlogCategoryFormState } from "./actions";

export function BlogCategoryForm({
  action,
  initialValues,
}: {
  action: (state: BlogCategoryFormState, formData: FormData) => Promise<BlogCategoryFormState>;
  initialValues?: { name: string; slug: string; description: string };
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <FormField label="Ad" htmlFor="name">
        <input id="name" name="name" defaultValue={initialValues?.name} required className={inputClass} />
      </FormField>
      <FormField label="Slug" htmlFor="slug" hint="Boş bırakılırsa isimden otomatik üretilir.">
        <input id="slug" name="slug" defaultValue={initialValues?.slug} className={inputClass} />
      </FormField>
      <FormField label="Açıklama" htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description}
          rows={3}
          className={textareaClass}
        />
      </FormField>

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
