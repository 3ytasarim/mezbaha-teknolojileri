"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaWithStateAction, type DeleteMediaState } from "./actions";

const initialState: DeleteMediaState = {};

export function MediaDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async () => {
    const result = await deleteMediaWithStateAction(id);
    if (result.done) router.refresh();
    return result;
  }, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`"${name}" dosyasını silmek istediğinize emin misiniz?`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" disabled={pending} className="text-xs font-medium text-red-400 hover:text-red-300">
        {pending ? "Siliniyor..." : "Sil"}
      </button>
      {state.error && <p className="mt-1 text-[10px] text-red-400">{state.error}</p>}
    </form>
  );
}
