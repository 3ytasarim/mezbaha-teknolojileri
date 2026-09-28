/** YouTube adresinden (watch?v=, youtu.be/, embed/) 11 karakterlik video kimliğini çıkarır; geçersizse null. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
