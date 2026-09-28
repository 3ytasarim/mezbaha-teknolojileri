"use client";

import { useActionState } from "react";
import { FormField, inputClass, selectClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import type { RedirectFormState } from "./actions";

type Values = { sourcePath: string; destinationPath: string; statusCode: number; active: boolean };

export function RedirectForm({
  action,
  initialValues,
}: {
  action: (state: RedirectFormState, formData: FormData) => Promise<RedirectFormState>;
  initialValues?: Values;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormField label="Eski adres" htmlFor="sourcePath" hint="Yönlendirilecek eski yol. Örn. /tr/buyukbas-mezbaha-makinalari (alan adı olmadan, / ile başlar).">
        <input id="sourcePath" name="sourcePath" defaultValue={initialValues?.sourcePath} required placeholder="/tr/eski-sayfa" className={inputClass} />
      </FormField>

      <FormField label="Yeni adres" htmlFor="destinationPath" hint="Site içi yol (/urunler/buyukbas) veya tam adres (https://…).">
        <input id="destinationPath" name="destinationPath" defaultValue={initialValues?.destinationPath} required placeholder="/urunler/buyukbas" className={inputClass} />
      </FormField>

      <FormField
        label="Yönlendirme türü"
        htmlFor="statusCode"
        hint="Kalıcı taşıma için 301 (arama motorları eski adresin değerini yenisine aktarır). Geçici durumlar için 302."
      >
        <select id="statusCode" name="statusCode" defaultValue={initialValues?.statusCode ?? 301} className={selectClass}>
          <option value={301}>301 — Kalıcı (önerilen)</option>
          <option value={308}>308 — Kalıcı (yöntemi korur)</option>
          <option value={302}>302 — Geçici</option>
          <option value={307}>307 — Geçici (yöntemi korur)</option>
        </select>
      </FormField>

      <label className="flex items-center gap-2 text-sm text-neutral-200">
        <input type="checkbox" name="active" defaultChecked={initialValues?.active ?? true} className="h-4 w-4" />
        Aktif
      </label>

      <p className="text-xs text-neutral-500">Değişiklikler, sitenin önbelleği nedeniyle yaklaşık 1 dakika içinde etkili olur.</p>

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
