"use client";

import { useActionState } from "react";
import { FormField, inputClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import type { SettingsFormState } from "./actions";
import { EMAIL_SLOTS, PHONE_SLOTS } from "./slots";

type Row = { label: string; value: string };
type Values = { phones: Row[]; emails: Row[]; address: { line1: string; line2: string; locality: string } };

function RowInputs({ prefix, index, row, valuePlaceholder }: { prefix: string; index: number; row?: Row; valuePlaceholder: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
      <input
        name={`${prefix}Label${index}`}
        defaultValue={row?.label}
        placeholder="Etiket (Genel, WhatsApp…)"
        aria-label={`${prefix} ${index + 1} etiket`}
        className={inputClass}
      />
      <input
        name={`${prefix}Value${index}`}
        defaultValue={row?.value}
        placeholder={valuePlaceholder}
        aria-label={`${prefix} ${index + 1} değer`}
        className={inputClass}
      />
    </div>
  );
}

export function SettingsForm({
  action,
  initialValues,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  initialValues: Values;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200">Telefonlar</h2>
          <p className="mt-1 text-xs text-neutral-500">
            İlk satır sitede ana telefon olarak gösterilir. <strong className="text-neutral-300">WhatsApp</strong> etiketli satır WhatsApp numarasıdır
            ve tüm &ldquo;Teklif İste&rdquo; düğmelerinde kullanılır. Boş satırlar yok sayılır.
          </p>
        </div>
        {Array.from({ length: PHONE_SLOTS }, (_, i) => (
          <RowInputs key={i} prefix="phone" index={i} row={initialValues.phones[i]} valuePlaceholder="+90 262 000 00 00" />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200">E-posta adresleri</h2>
          <p className="mt-1 text-xs text-neutral-500">İlk satır sitede ana e-posta olarak gösterilir.</p>
        </div>
        {Array.from({ length: EMAIL_SLOTS }, (_, i) => (
          <RowInputs key={i} prefix="email" index={i} row={initialValues.emails[i]} valuePlaceholder="bilgi@ornek.com" />
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-200">Adres</h2>
        <FormField label="Adres satırı 1" htmlFor="line1">
          <input id="line1" name="line1" defaultValue={initialValues.address.line1} required className={inputClass} />
        </FormField>
        <FormField label="Adres satırı 2" htmlFor="line2" hint="Mahalle, ilçe / il.">
          <input id="line2" name="line2" defaultValue={initialValues.address.line2} required className={inputClass} />
        </FormField>
        <FormField label="İlçe / İl (kısa)" htmlFor="locality" hint="Arama motorları için (yapısal veri). Örn. Dilovası / Kocaeli">
          <input id="locality" name="locality" defaultValue={initialValues.address.locality} required className={inputClass} />
        </FormField>
      </section>

      <p className="text-xs text-neutral-500">
        Kaydedince bu bilgiler sitede: iletişim sayfası, alt bilgi (footer), menü, ürün sayfaları, &ldquo;Teklif İste&rdquo; düğmeleri ve arama motoru
        verilerinde (kurumsal yapısal veri) güncellenir. Harita, adres satırlarından yol tarifi oluşturur; sayfa altındaki gömülü harita
        konumu ayrı olarak kodda tanımlıdır.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-emerald-300">
          Kaydedildi. Değişiklikler sitede yayında.
        </p>
      )}

      <div>
        <SubmitButton label="Kaydet" />
      </div>
    </form>
  );
}
