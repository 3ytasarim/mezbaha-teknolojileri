/**
 * İngilizce (ABD) içerikte ticari iddia denetimi. Site mezbaha makine ve ekipmanı sunar; anahtar teslim kurulum,
 * tesis inşaatı/projelendirmesi, devreye alma veya doğrulanmamış sertifika/garanti/hizmet iddiası yapılamaz.
 * Saf fonksiyonlar (DB/ağ yok): birim testleri (tests/seo) kullanır.
 */
export type ClaimRule = { id: string; label: string; re: RegExp };

export const CLAIM_RULES: ClaimRule[] = [
  { id: "TURNKEY", label: "Anahtar teslim / turnkey", re: /turn-?key|anahtar teslim/i },
  { id: "COMMISSIONING", label: "Devreye alma (commissioning)", re: /\bcommission(ing|ed)\b/i },
  { id: "INSTALLATION_SERVICE", label: "Kurulum hizmeti izlenimi", re: /(professional|full|complete|on-?site|plant|new slaughterhouse) installation|installation (and|&) commissioning|plants? (installed|completed|built)|installed and commissioned|we (install|build|construct)\b/i },
  { id: "CONSTRUCTION_EPC", label: "Tesis inşaatı / EPC / bina tasarımı", re: /\bEPC\b|general contractor|design[- ]build|slaughterhouse (building|plant|facility) (design|construction)|building design|plant engineering|capacity-specific slaughterhouse|slaughterhouse (is|was) built|built on a/i },
  { id: "DESIGN_SERVICE", label: "Tesis/proje tasarım hizmeti", re: /\bwe (design|plan)\b|design(ing)? (and|&) manufactur\w* (customer-specific )?(slaughterhouse|systems)|project (team|experts)|plan your plant/i },
  { id: "SUPERLATIVE", label: "Doğrulanmamış üstünlük iddiası", re: /\bleader in\b|\b(a|the|our) leading\b|number one|world[- ]class|proven in the field|most modern/i },
  { id: "CERTIFICATION", label: "Doğrulanmamış sertifika/uyum", re: /\bUSDA\b|\bFSIS\b|certified for|approved by|fully compliant|100% halal-compliant|in compliance with international standards/i },
  { id: "WARRANTY_SERVICE", label: "Garanti / ABD servis ağı", re: /lifetime warranty|nationwide|guaranteed (productivity|increase)|US service network|backed by a warranty/i },
];

/** Olumsuzlama/kapsam açıklaması içeren cümleler (ör. "We do not offer plant construction...") iddia sayılmaz. */
const DISCLAIMER = /\b(do not|does not|don't|not) (offer|provide|perform|carry out)\b|carried out by the customer|is the customer's responsibility/i;

const strip = (t: string) => t.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export type ClaimHit = { rule: string; label: string; match: string; context: string };

export function findClaims(raw: string): ClaimHit[] {
  const text = strip(raw);
  const sentences = text.split(/(?<=[.!?])\s+/);
  const hits: ClaimHit[] = [];
  for (const sentence of sentences) {
    if (DISCLAIMER.test(sentence)) continue;
    for (const r of CLAIM_RULES) {
      const m = sentence.match(r.re);
      if (m) hits.push({ rule: r.id, label: r.label, match: m[0], context: sentence.slice(0, 200) });
    }
  }
  return hits;
}

/**
 * Doğrulanana kadar KODDAKİ metinlerde (sözlük + ana sayfa SEO metni) kullanılmayacak ifadeler:
 * - HIDE_PULLER: doğrulanmamış ürün işlevi ifadesi.
 * - ITEMIZED_MANUFACTURE: "manufactures <ürün listesi>" kalıbı (ürün bazında üretim iddiası).
 * - MANUFACTURER_CLAIM: şirket düzeyinde "manufacturer / own workshop / in-house" iddiası.
 */
export const GATED_TERMS: { id: string; re: RegExp; reason: string }[] = [
  { id: "HIDE_PULLER", re: /hide[- ]?pull|hide[- ]removal/i, reason: "Doğrulanmamış ürün işlevi ifadesi" },
  { id: "ITEMIZED_MANUFACTURE", re: /\bmanufactur\w*\b[^.]{0,80}\b(saws?|stunning|skinning|hide)\b/i, reason: "Doğrulanmamış ürün bazında üretim iddiası" },
  { id: "MANUFACTURER_CLAIM", re: /\bmanufacturer\b|\b(we|our company) (manufacture|produce|make)\b|\bown workshop\b|\bin-house\b|\bmanufactured in\b/i, reason: "Doğrulanmamış şirket düzeyinde üretici iddiası" },
];

export function findGatedTerms(raw: string): { id: string; match: string }[] {
  const text = strip(raw);
  return GATED_TERMS.flatMap((g) => {
    const m = text.match(g.re);
    return m ? [{ id: g.id, match: m[0] }] : [];
  });
}
