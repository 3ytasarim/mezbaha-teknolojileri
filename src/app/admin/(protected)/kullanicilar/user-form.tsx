"use client";

import { useActionState } from "react";
import { FormField, inputClass, selectClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import type { UserFormState } from "./actions";

type Values = { name: string; email: string; role: "EDITOR" | "ADMIN" | "SUPERADMIN"; active: boolean };

export function UserForm({
  action,
  initialValues,
  isSelf = false,
  isEdit = false,
}: {
  action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  initialValues?: Values;
  /** Kendi hesabı: rol ve aktiflik değiştirilemez */
  isSelf?: boolean;
  isEdit?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} autoComplete="off" className="flex max-w-xl flex-col gap-6">
      <FormField label="Ad Soyad" htmlFor="name">
        <input id="name" name="name" defaultValue={initialValues?.name} required className={inputClass} />
      </FormField>

      <FormField label="E-posta" htmlFor="email" hint="Giriş için kullanılır.">
        <input id="email" name="email" type="email" defaultValue={initialValues?.email} required autoComplete="off" className={inputClass} />
      </FormField>

      <FormField
        label="Rol"
        htmlFor="role"
        hint="Editör: içerik yönetir. Yönetici: ayrıca yönlendirme ve kategori gibi site yapısını değiştirir. Süper admin: kullanıcıları da yönetir."
      >
        <select id="role" name="role" defaultValue={initialValues?.role ?? "EDITOR"} disabled={isSelf} className={selectClass}>
          <option value="EDITOR">Editör</option>
          <option value="ADMIN">Yönetici</option>
          <option value="SUPERADMIN">Süper Admin</option>
        </select>
        {isSelf && <input type="hidden" name="role" value={initialValues?.role} />}
      </FormField>

      <label className="flex items-center gap-2 text-sm text-neutral-200">
        <input type="checkbox" name="active" defaultChecked={initialValues?.active ?? true} disabled={isSelf} className="h-4 w-4" />
        Aktif (giriş yapabilir)
        {isSelf && <input type="hidden" name="active" value="on" />}
      </label>
      {isSelf && <p className="-mt-3 text-xs text-neutral-500">Kendi hesabınızın rolünü ve aktifliğini değiştiremezsiniz.</p>}

      <div className="flex flex-col gap-4 border-t border-neutral-800 pt-6">
        <h2 className="text-sm font-semibold text-neutral-300">{isEdit ? "Şifreyi değiştir (isteğe bağlı)" : "Şifre"}</h2>
        <FormField label={isEdit ? "Yeni şifre" : "Şifre"} htmlFor="password" hint="En az 12 karakter. Kolay tahmin edilemeyen bir şifre seçin.">
          <input id="password" name="password" type="password" autoComplete="new-password" required={!isEdit} className={inputClass} />
        </FormField>
        <FormField label="Şifre (tekrar)" htmlFor="passwordConfirm">
          <input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required={!isEdit} className={inputClass} />
        </FormField>
        {isEdit && <p className="text-xs text-neutral-500">Şifre değiştirildiğinde kullanıcının açık oturumları kapatılır.</p>}
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
