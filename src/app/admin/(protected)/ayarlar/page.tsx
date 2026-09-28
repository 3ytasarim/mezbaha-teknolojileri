import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { CONTACT_SETTING_KEY, getContactSettings } from "@/lib/site-settings";
import { resetContactSettingsAction, saveContactSettingsAction } from "./actions";
import { SettingsForm } from "./settings-form";

/** Site ayarları: iletişim bilgileri (telefon, e-posta, adres). Kayıt yoksa kodda tanımlı varsayılanlar kullanılır. */
export default async function AdminSettingsPage() {
  await requireAdmin("ADMIN");
  const [contact, stored] = await Promise.all([
    getContactSettings(),
    prisma.siteSetting.findUnique({ where: { key: CONTACT_SETTING_KEY }, select: { updatedAt: true } }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Site Ayarları</h1>
          <p className="mt-1 text-sm text-neutral-400">
            İletişim bilgileri.{" "}
            {stored
              ? `Son kayıt: ${stored.updatedAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}.`
              : "Henüz kaydedilmiş ayar yok; site şu an kodda tanımlı varsayılan bilgileri kullanıyor."}
          </p>
        </div>
        {stored && (
          <form action={resetContactSettingsAction}>
            <button type="submit" className="text-sm font-medium text-neutral-300 underline underline-offset-4 hover:text-white">
              Varsayılana dön
            </button>
          </form>
        )}
      </div>

      <div className="mt-6">
        <SettingsForm
          action={saveContactSettingsAction}
          initialValues={{
            phones: contact.phones,
            emails: contact.emails,
            address: { line1: contact.address.line1, line2: contact.address.line2, locality: contact.address.locality },
          }}
        />
      </div>
    </div>
  );
}
