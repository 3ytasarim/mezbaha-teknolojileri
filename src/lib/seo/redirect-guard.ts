import { localizePath, resolvePublicPath } from "@/lib/i18n/routes";

/**
 * Yönlendirme (Redirect) kurallarının SEO güvenliği. Saf fonksiyonlar (veritabanı/ağ yok) — hem yönetim
 * panelindeki kaydetme akışı (src/lib/seo/redirect-service.ts) hem de `npm run redirects:check` / testler tarafından kullanılır.
 *
 * Neden var: 13 Ekim 2026'da redirect hedefleri sabit Türkçe iç yollara (/urun/…, /urunler) çevrildi; sitenin gerçek
 * canonical adresleri ise dile göre yerelleşir (/product/…, /products, /ru/produkt/…). Ayrıca kaynağı güncel canonical
 * bir adres olan kurallar src/proxy.ts'te dil çözümlemesinden ÖNCE çalıştığı için sayfanın kendisini 301'e çevirdi.
 * Bu kurallar o iki hatayı (ve zincir/döngü/çakışma türevlerini) yeniden üretilemez kılar.
 */

export type RedirectIssueCode =
  | "SELF" // kaynak = hedef
  | "LOOP" // hedeften başlayan zincir kaynağa geri dönüyor (A→B→…→A)
  | "SOURCE_IS_CANONICAL" // kaynak, sitenin canlı canonical (sitemap) adresi → sayfayı gasp eder
  | "DEST_NOT_CANONICAL" // hedef 200 verebilir ama canonical'ı başka adres → tek-hop standardı bozulur
  | "LOCALE_MISMATCH" // kaynak ve hedef farklı dilde
  | "CHAIN_OUT" // hedef başka bir aktif redirect'in kaynağı (zincir)
  | "CHAIN_IN" // bu kaynağa işaret eden başka aktif redirect var (zincir oluşur)
  | "DUPLICATE_SOURCE"; // aynı (normalize) kaynak için başka bir kayıt var

export type RedirectIssue = { code: RedirectIssueCode; message: string; suggestion?: string };

export type RedirectGuardContext = {
  /** Sitemap'teki (indekslenebilir canonical) yollar. Verilmezse SOURCE_IS_CANONICAL denetlenmez. */
  canonicalPaths?: ReadonlySet<string>;
  /** Diğer AKTİF kurallar: kaynak yol → hedef yol (denetlenen kural hariç). Verilmezse zincir/döngü denetlenmez. */
  activeRules?: ReadonlyMap<string, string>;
  /** Diğer TÜM kayıtların (aktif+pasif) normalize kaynakları (denetlenen kayıt hariç). Verilmezse çakışma denetlenmez. */
  otherSources?: ReadonlySet<string>;
};

export const normalizePath = (p: string): string => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);

const isExternal = (v: string) => /^https?:\/\//i.test(v);
const splitSuffix = (v: string): [string, string] => {
  const i = v.search(/[?#]/);
  return i < 0 ? [v, ""] : [v.slice(0, i), v.slice(i)];
};
const pathKey = (v: string) => normalizePath(splitSuffix(v)[0]);

/** Bir görünen yolun, sitenin üretmek isteyeceği biçimi (iç yola çözülüp dilin segmentleriyle yeniden yazılır). */
export function canonicalFormOf(path: string): string {
  const [pathOnly, suffix] = splitSuffix(path);
  const { locale, internalPath } = resolvePublicPath(pathOnly);
  return normalizePath(localizePath(locale, internalPath)) + suffix;
}

export const localeOfPath = (path: string) => resolvePublicPath(splitSuffix(path)[0]).locale;

/**
 * Tek bir kural için sorunları döndürür (boş dizi = güvenli). `active=false` kurallarda yalnız çakışma (DUPLICATE_SOURCE)
 * denetlenir: pasif bir kayıt trafiği etkilemez; yeniden etkinleştirildiğinde tam denetim yapılır.
 * Mesajlar yönetim panelinde kullanıcıya olduğu gibi gösterilir.
 */
export function checkRedirectRule(rule: { source: string; destination: string; active?: boolean }, ctx: RedirectGuardContext = {}): RedirectIssue[] {
  const issues: RedirectIssue[] = [];
  const source = normalizePath(rule.source);

  if (ctx.otherSources?.has(source)) {
    issues.push({ code: "DUPLICATE_SOURCE", message: `"${source}" adresi için zaten bir yönlendirme kaydı var. Aynı eski adres için ikinci bir kural eklenemez; mevcut kaydı düzenleyin.` });
  }
  if (rule.active === false) return issues;

  const canonicalSource = ctx.canonicalPaths?.has(source) ?? false;
  if (canonicalSource) {
    issues.push({ code: "SOURCE_IS_CANONICAL", message: `"${source}" adresi zaten canonical bir sayfaya ait (sitemap'te var). Redirect oluşturulamaz; aksi halde sayfanın kendisi 301'e dönüşür.` });
  }

  if (isExternal(rule.destination)) return issues;

  const dest = pathKey(rule.destination);

  if (dest === source) {
    issues.push({ code: "SELF", message: "Eski ve yeni adres aynı olamaz (sonsuz döngü)." });
    return issues;
  }

  const canon = normalizePath(canonicalFormOf(dest));
  if (canon !== dest) {
    issues.push({ code: "DEST_NOT_CANONICAL", message: `Yeni adres canonical biçimde değil. "${canon}" adresini kullanın (dile göre yerelleşmiş segmentler gerekir).`, suggestion: canon });
  }

  if (localeOfPath(source) !== localeOfPath(dest)) {
    issues.push({ code: "LOCALE_MISMATCH", message: `Eski adres "${localeOfPath(source)}", yeni adres "${localeOfPath(dest)}" dilinde. Farklı dile yönlendirme yapılamaz.` });
  }

  if (ctx.activeRules) {
    // İleri yön: hedeften başlayarak aktif kuralları izle.
    if (ctx.activeRules.has(dest)) {
      const seen = new Set([source, dest]);
      let cur = dest;
      let loop = false;
      for (let hops = 0; hops < 50; hops++) {
        const next = ctx.activeRules.get(cur);
        if (next === undefined) break;
        if (isExternal(next)) { cur = next; break; }
        const n = pathKey(next);
        if (seen.has(n)) { loop = true; break; }
        seen.add(n);
        cur = n;
      }
      if (loop) issues.push({ code: "LOOP", message: `Bu yönlendirme döngü oluşturacağı için kaydedilemedi: "${dest}" adresinden başlayan yönlendirmeler tekrar "${source}" veya kendi içinde döner.` });
      else issues.push({ code: "CHAIN_OUT", message: `Bu yönlendirme zincir oluşturacağı için kaydedilemedi: "${dest}" adresi kendisi de başka bir adrese yönleniyor. Doğrudan son adresi ("${cur}") girin.`, suggestion: cur });
    }
    // Geri yön: bu kaynağa işaret eden başka bir aktif kural var mı?
    for (const [src, dst] of ctx.activeRules) {
      if (!isExternal(dst) && pathKey(dst) === source && src !== source) {
        issues.push({ code: "CHAIN_IN", message: `Bu yönlendirme zincir oluşturacağı için kaydedilemedi: "${src}" adresi zaten "${source}" adresine yönleniyor. Önce o kaydın hedefini güncelleyin.` });
        break;
      }
    }
  }
  return issues;
}

/** Tüm kayıtları birlikte denetler (CLI denetimi/testler için). Yalnız sorunlu kayıtları döndürür. */
export function checkRedirectTable(
  rules: readonly { id?: string; source: string; destination: string; active: boolean }[],
  canonicalPaths?: ReadonlySet<string>,
) {
  const sourceCount = new Map<string, number>();
  for (const r of rules) sourceCount.set(normalizePath(r.source), (sourceCount.get(normalizePath(r.source)) ?? 0) + 1);
  const activeRules = new Map(rules.filter((r) => r.active).map((r) => [normalizePath(r.source), r.destination] as const));
  return rules.flatMap((r) => {
    const key = normalizePath(r.source);
    const others = new Map(activeRules);
    others.delete(key);
    const otherSources = new Set((sourceCount.get(key) ?? 0) > 1 ? [key] : []);
    const issues = checkRedirectRule({ source: r.source, destination: r.destination, active: r.active }, { canonicalPaths, activeRules: others, otherSources });
    return issues.length ? [{ id: r.id, source: r.source, destination: r.destination, issues }] : [];
  });
}
