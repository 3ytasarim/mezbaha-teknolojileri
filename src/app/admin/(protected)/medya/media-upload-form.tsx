"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadMediaAction, type UploadMediaState } from "./actions";

const initialState: UploadMediaState = {};

export function MediaUploadForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev: UploadMediaState, formData: FormData) => {
    const result = await uploadMediaAction(prev, formData);
    if (result.media) router.refresh();
    return result;
  }, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-neutral-700 text-sm text-neutral-400 hover:border-neutral-500">
        {pending ? "Yükleniyor..." : "Dosya seçmek için tıklayın (JPEG, PNG, WebP, GIF, PDF — max 8MB)"}
        <input
          type="file"
          name="file"
          className="hidden"
          disabled={pending}
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              const formData = new FormData(form);
              startTransition(() => formAction(formData));
            }
          }}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-xs text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
