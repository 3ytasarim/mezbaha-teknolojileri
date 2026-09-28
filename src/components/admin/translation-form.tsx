"use client";

import { useActionState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import type { TranslationFormState } from "@/app/admin/(protected)/ceviriler/actions";
import type { FieldKey, TranslationValues } from "@/lib/admin-translations";

type Field = { key: FieldKey; label: string; multiline?: number; hint?: string; html?: boolean };

/** Bir dilin çeviri formu (TR metin sol tarafta başvuru olarak gösterilir). RTL dillerde alanlar sağdan sola. */
export function TranslationForm({
  action,
  fields,
  values,
  reference,
  rtl,
  lang,
}: {
  action: (state: TranslationFormState, formData: FormData) => Promise<TranslationFormState>;
  fields: Field[];
  values: TranslationValues;
  reference: TranslationValues;
  rtl: boolean;
  lang: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as TranslationFormState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{state.message}</p>
      )}
      {state.status === "success" && state.message && (
        <p role="status" className="rounded-md border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">{state.message}</p>
      )}

      {fields.map((f) => {
        const id = `${lang}-${f.key}`;
        const ref = reference[f.key];
        return (
          <FormField key={f.key} label={f.label} htmlFor={id} error={errors[f.key]} hint={f.hint}>
            {ref ? (
              <p className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs leading-relaxed text-neutral-400">
                <span className="font-semibold text-neutral-300">TR: </span>
                {ref.length > 320 ? `${ref.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 320)}…` : ref.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}
              </p>
            ) : null}
            {f.multiline ? (
              <textarea id={id} name={f.key} rows={f.multiline} defaultValue={values[f.key] ?? ""} dir={rtl ? "rtl" : "ltr"} className={`${textareaClass} ${f.html ? "font-mono text-xs" : ""}`} />
            ) : (
              <input id={id} name={f.key} defaultValue={values[f.key] ?? ""} dir={rtl && f.key !== "slug" ? "rtl" : "ltr"} className={inputClass} />
            )}
          </FormField>
        );
      })}

      <div>
        <SubmitButton label="Çeviriyi Kaydet" />
      </div>
    </form>
  );
}
