"use client";

import { useActionState } from "react";
import { toggleRedirectAction, type ToggleRedirectState } from "./actions";

/**
 * Aç/Kapat düğmesi. Sunucu tarafı güvenlik denetimi bir kaydın etkinleştirilmesini reddederse (ör. canonical bir sayfayı
 * gasp edecek ya da zincir/döngü oluşturacak kural) neden kullanıcıya gösterilir; işlem sessizce yok sayılmaz.
 */
export function ToggleRedirectButton({ id, active }: { id: string; active: boolean }) {
  const [state, formAction, pending] = useActionState<ToggleRedirectState, FormData>(toggleRedirectAction.bind(null, id), {});

  return (
    <form action={formAction} className="flex flex-col items-end">
      <button type="submit" disabled={pending} className="text-sm font-medium text-neutral-300 hover:text-white disabled:opacity-50">
        {pending ? "…" : active ? "Kapat" : "Aç"}
      </button>
      {state.error && (
        <p role="alert" className="mt-1 max-w-[320px] text-right text-xs text-red-300">
          Etkinleştirilemedi: {state.error}
        </p>
      )}
    </form>
  );
}
