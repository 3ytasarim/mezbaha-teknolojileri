import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizeNav } from "@/lib/i18n/nav";
import { localizePath } from "@/lib/i18n/routes";
import { getDisplayCategories } from "@/lib/content-fallback";
import { getContactSettings, onlyDigits, whatsappOf } from "@/lib/site-settings";
import { getNavigation } from "@/lib/navigation";
import { SiteHeader } from "./site-header";
import { ENABLED_LOCALES, LOCALE_META } from "@/lib/i18n/config";

export async function Header() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const categories = await getDisplayCategories(locale);
  const contact = await getContactSettings();
  const nav = await getNavigation();
  const phone = contact.phones[0].value;
  const wa = whatsappOf(contact);
  const whatsappHref = wa.digits
    ? `https://wa.me/${wa.digits}?text=${encodeURIComponent(dict.common.whatsappGreeting)}`
    : localizePath(locale, "/iletisim");

  return <SiteHeader categories={categories} leftLinks={localizeNav(nav["header-left"], locale, dict)} rightLinks={localizeNav(nav["header-right"], locale, dict)} phone={phone} phoneDigits={onlyDigits(phone)} whatsappHref={whatsappHref} languages={ENABLED_LOCALES.map((l) => ({ locale: l, label: LOCALE_META[l].label, name: LOCALE_META[l].nativeName }))} />;
}
