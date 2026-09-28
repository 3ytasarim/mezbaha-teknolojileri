/**
 * Kaynak makalelerdeki, eski sitede de 404 dönen (ölü) iç linkler. Yalnızca gerçek bir
 * anlamsal karşılık varsa yeni yola çevrilir; karşılık yoksa link kaldırılır (metin korunur).
 * Eski sitede doğrulama (Phase 11C): /mezbaha-makinalari, /robotik-mezbaha-sistemleri → 404;
 * /endustriyel-sogutma-sistemleri (www olmayan) → 404 (yalnızca /tr/ altında bir hizmet sayfası var).
 *
 * null = yeni sitede uygun hedef yok → <a> etiketi kaldırılır, anchor metni korunur.
 */
export const DEAD_LINK_OVERRIDES: Record<string, string | null> = {
  // Anchor'lar: "mezbaha makineleri", "kesimhane malzemeleri", "Modern kesim makineleri" → makine katalogu
  "/mezbaha-makinalari": "/urunler",
  // Anchor: "Robotik" → aynı konuyu işleyen yayınlı makale
  "/robotik-mezbaha-sistemleri": "/blog/robotik-mezbaha-sistemleri-nedir",
  // Phase 11D: eski sitedeki gerçek hizmet sayfası (/tr/endustriyel-sogutma-sistemleri/) yeni sitede
  // CMS hizmet sayfası olarak taşındı → link geri eklenir (Phase 11C'de kaldırılmıştı).
  "/endustriyel-sogutma-sistemleri": "/hizmetler/endustriyel-sogutma-sistemleri",
};

const HOSTS = String.raw`https?:\/\/(?:www\.)?mezbahateknolojileri\.com`;

export function applyDeadLinkOverrides(html: string): { html: string; changes: string[] } {
  const changes: string[] = [];
  let out = html;
  for (const [legacy, target] of Object.entries(DEAD_LINK_OVERRIDES)) {
    const p = legacy.replace(/[.*+?^${}()|[\]\/]/g, "\$&");
    if (target === null) {
      const re = new RegExp(String.raw`<a\b[^>]*href="${HOSTS}${p}\/?"[^>]*>([\s\S]*?)<\/a>`, "gi");
      out = out.replace(re, (_m, inner: string) => {
        changes.push(`${legacy} -> (link kaldırıldı, metin korundu)`);
        return inner;
      });
    } else {
      const re = new RegExp(String.raw`href="${HOSTS}${p}\/?"`, "gi");
      out = out.replace(re, () => {
        changes.push(`${legacy} -> ${target}`);
        return `href="${target}"`;
      });
    }
  }
  // Eski sitenin kök (ana sayfa) linkleri -> göreli "/" (ana sayfa = ana sayfa, birebir karşılık;
  // kesinleşmemiş bir mutlak alan adına sabitlenmez).
  const rootRe = new RegExp(String.raw`href="${HOSTS}\/?"`, "gi");
  out = out.replace(rootRe, () => {
    changes.push("(eski ana sayfa) -> /");
    return 'href="/"';
  });
  return { html: out, changes };
}
