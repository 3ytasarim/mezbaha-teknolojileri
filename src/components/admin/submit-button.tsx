"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-md bg-neutral-100 px-5 text-sm font-medium text-neutral-900 transition-opacity disabled:opacity-60"
    >
      {pending ? (pendingLabel ?? "Kaydediliyor...") : label}
    </button>
  );
}
