import { checkRedirectRule, normalizePath, type RedirectIssue, type RedirectIssueCode } from "@/lib/seo/redirect-guard";

/**
 * Yönlendirme kaydetme iş mantığı — sunucu tarafı doğrulama BURADA zorunludur (arayüz kontrolü yeterli sayılmaz).
 * Veritabanından bağımsızdır (enjekte edilen `RedirectStore`); böylece izole/sahte verilerle test edilebilir.
 * Üretimde `withLock`, tek bir Postgres işlemi içinde `pg_advisory_xact_lock` alır: iki yönetici aynı anda kaydetse bile
 * doğrulama + yazma sıralanır, "A→B" ve "B→C" ikilisinin aynı anda eklenip zincir oluşturması engellenir.
 */

export type RedirectInput = { sourcePath: string; destinationPath: string; statusCode: number; active: boolean };
export type StoredRedirect = RedirectInput & { id: string };

export interface RedirectTx {
  /** Tüm kayıtlar (aktif + pasif); kilit altında okunur. */
  listAll(): Promise<StoredRedirect[]>;
  create(input: RedirectInput): Promise<StoredRedirect>;
  update(id: string, patch: Partial<RedirectInput>): Promise<void>;
}
export interface RedirectStore {
  withLock<T>(fn: (tx: RedirectTx) => Promise<T>): Promise<T>;
}

export type SaveErrorCode = RedirectIssueCode | "NOT_FOUND" | "VERIFICATION_UNAVAILABLE";
export type SaveResult = { ok: true; id: string; changed: boolean } | { ok: false; code: SaveErrorCode; error: string; issues?: RedirectIssue[] };

/** Sitemap'teki (canonical) yolların kümesi. Üretilemezse `null` → aktif kayıt kaydı GÜVENLİK İÇİN reddedilir (fail-closed). */
export type CanonicalProvider = () => Promise<ReadonlySet<string> | null>;

const UNAVAILABLE = "Canonical sayfa listesi doğrulanamadığı için güvenlik amacıyla kaydedilmedi. Lütfen birkaç saniye sonra tekrar deneyin.";

function toResult(issues: RedirectIssue[]): SaveResult | null {
  if (!issues.length) return null;
  // Arayüzde okunaklı kalması için en önemli ilk iki neden gösterilir; tümü `issues` içinde döner.
  return { ok: false, code: issues[0].code, error: issues.slice(0, 2).map((i) => i.message).join(" "), issues };
}

/** Kilit altında, güncel tabloya göre bir kuralı denetler. `ignoreId`: güncellenen kaydın kendisi. */
function validate(all: StoredRedirect[], rule: RedirectInput, canonicalPaths: ReadonlySet<string> | undefined, ignoreId?: string): SaveResult | null {
  const others = all.filter((r) => r.id !== ignoreId);
  const activeRules = new Map(others.filter((r) => r.active).map((r) => [normalizePath(r.sourcePath), r.destinationPath] as const));
  const otherSources = new Set(others.map((r) => normalizePath(r.sourcePath)));
  return toResult(checkRedirectRule({ source: rule.sourcePath, destination: rule.destinationPath, active: rule.active }, { canonicalPaths, activeRules, otherSources }));
}

/** Yeni kayıt (`id` yok) veya güncelleme (`id` var). Yazma yalnız doğrulama başarılıysa, aynı kilit altında yapılır. */
export async function saveRedirect(args: { store: RedirectStore; canonical: CanonicalProvider; input: RedirectInput; id?: string }): Promise<SaveResult> {
  const input: RedirectInput = { ...args.input, sourcePath: normalizePath(args.input.sourcePath) };
  // Sitemap (ağır) kilit dışında; sonuç yalnız kaynak-canonical denetimi içindir ve dakikalar içinde değişmez.
  let canonicalPaths: ReadonlySet<string> | undefined;
  if (input.active) {
    const c = await args.canonical().catch(() => null);
    if (!c) return { ok: false, code: "VERIFICATION_UNAVAILABLE", error: UNAVAILABLE };
    canonicalPaths = c;
  }
  return args.store.withLock(async (tx) => {
    const all = await tx.listAll();
    if (args.id && !all.some((r) => r.id === args.id)) return { ok: false, code: "NOT_FOUND", error: "Kayıt bulunamadı (başka bir yönetici silmiş olabilir)." } as SaveResult;
    const bad = validate(all, input, canonicalPaths, args.id);
    if (bad) return bad;
    if (args.id) {
      await tx.update(args.id, input);
      return { ok: true, id: args.id, changed: true } as SaveResult;
    }
    const row = await tx.create(input);
    return { ok: true, id: row.id, changed: true } as SaveResult;
  });
}

/**
 * Aktif/pasif geçişi. Pasif bir kaydı AÇARKEN tam denetim yapılır (13 Ekim'de 5 eski self-redirect denetimsiz
 * yeniden etkinleştirilip canonical sayfaları gasp etmişti). Kapatmak her zaman serbesttir.
 */
export async function toggleRedirect(args: { store: RedirectStore; canonical: CanonicalProvider; id: string }): Promise<SaveResult> {
  const snapshot = await args.store.withLock((tx) => tx.listAll());
  const current = snapshot.find((r) => r.id === args.id);
  if (!current) return { ok: false, code: "NOT_FOUND", error: "Kayıt bulunamadı (başka bir yönetici silmiş olabilir)." };
  if (current.active) {
    return args.store.withLock(async (tx) => {
      await tx.update(args.id, { active: false });
      return { ok: true, id: args.id, changed: true } as SaveResult;
    });
  }
  const canonicalPaths = await args.canonical().catch(() => null);
  if (!canonicalPaths) return { ok: false, code: "VERIFICATION_UNAVAILABLE", error: UNAVAILABLE };
  return args.store.withLock(async (tx) => {
    const all = await tx.listAll(); // kilit altında yeniden oku: ilk okumadan sonra değişmiş olabilir
    const row = all.find((r) => r.id === args.id);
    if (!row) return { ok: false, code: "NOT_FOUND", error: "Kayıt bulunamadı (başka bir yönetici silmiş olabilir)." } as SaveResult;
    if (row.active) return { ok: true, id: args.id, changed: false } as SaveResult; // başkası zaten açmış
    const bad = validate(all, { ...row, active: true }, canonicalPaths, args.id);
    if (bad) return bad;
    await tx.update(args.id, { active: true });
    return { ok: true, id: args.id, changed: true } as SaveResult;
  });
}
