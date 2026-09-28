import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findRedirect } from "@/lib/redirects";
import { getSiteUrl } from "@/lib/seo/site";
import { DEFAULT_LOCALE, LANG_HEADER, isEnabledLocale, isPageAvailable } from "@/lib/i18n/config";
import { resolvePublicPath } from "@/lib/i18n/routes";

const SESSION_COOKIE = "admin_session";

/**
 * Yönlendirmelerin mutlak URL tabanı. Production'da HER ZAMAN kanonik origin
 * (https://www.mezbahateknolojileri.com): nginx arkasında request.url'nin host/şeması
 * (ör. http://127.0.0.1:3000) güvenilir olmadığından http'ye düşme veya yanlış host riskini ortadan
 * kaldırır ve tek adımlı 301'i garanti eder. Development'ta istek origin'i kullanılır.
 */
function redirectBase(request: NextRequest): string {
  return process.env.NODE_ENV === "production" ? getSiteUrl() : new URL(request.url).origin;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const base = redirectBase(request);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = request.cookies.has(SESSION_COOKIE);
    if (!hasSession) {
      return NextResponse.redirect(new URL("/admin/login", base));
    }
    return NextResponse.next();
  }

  const redirectEntry = await findRedirect(pathname);
  if (redirectEntry) {
    const target = new URL(redirectEntry.destinationPath, base);
    // Sorgu dizesi (ör. utm_*) korunur; hedefin kendi sorgusu varsa ona dokunulmaz.
    if (!target.search && search) target.search = search;
    return NextResponse.redirect(target, redirectEntry.statusCode);
  }

  // next.config.ts `skipTrailingSlashRedirect: true`: sondaki "/" burada yönetilir. Redirect eşleşmesi
  // yukarıda (eski URL'ler "/" ile biter) TEK adımda 301 döner; eşleşme yoksa eski davranış korunur
  // (sondaki "/" atılır, 308). Böylece "/tr/x/" -> "/tr/x" -> hedef zinciri oluşmaz.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    // NextURL.clone() sondaki "/"yi geri ekleyebiliyor (döngü) → düz URL kullanılır.
    const url = new URL(pathname.slice(0, -1) + search, base);
    return NextResponse.redirect(url, 308);
  }

  // Dil: her istek için iç (Türkçe) yola çözülür ve dil bir istek başlığıyla sayfaya iletilir. Başlık her istekte
  // proxy tarafından ÜZERİNE YAZILIR (istemcinin gönderdiği x-lang değeri geçerli olmaz). DEFAULT_LOCALE (İngilizce)
  // önek almadığı için, önek olmayan yollarda da parça çevirisi (ör. /products → /urunler) burada geri çözülür.
  const { locale, internalPath } = resolvePublicPath(pathname);
  const headers = new Headers(request.headers);
  if (locale !== DEFAULT_LOCALE) {
    // Etkin olmayan veya bu dilde olmayan sayfa (ör. /de/products): yeniden yazılmaz → 404
    if (!isEnabledLocale(locale) || !isPageAvailable(locale, internalPath)) return NextResponse.next();
  }
  headers.set(LANG_HEADER, locale);
  if (internalPath === pathname) return NextResponse.next({ request: { headers } });
  const url = request.nextUrl.clone();
  url.pathname = internalPath;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|api).*)",
  ],
};
