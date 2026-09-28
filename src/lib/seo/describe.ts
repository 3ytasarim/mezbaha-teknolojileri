/**
 * Kaynakta meta description bulunmayan sayfalar için, sayfanın GERÇEK metninden
 * (ilk cümleler) bir description türetir. Metin uydurmaz; DB'ye yazılmaz, render sırasında hesaplanır.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveDescription(html: string | null | undefined, max = 155): string {
  const text = htmlToText(html ?? "");
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out = (out + s).trim() + " ";
  }
  out = out.trim();
  if (out.length >= 60) return out;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
}

/** İlk paragrafın düz metni (liste/özet kartları için). */
export function firstParagraphText(html: string | null | undefined): string {
  const m = (html ?? "").match(/<p>([\s\S]*?)<\/p>/);
  return m ? htmlToText(m[1]) : htmlToText(html ?? "");
}
