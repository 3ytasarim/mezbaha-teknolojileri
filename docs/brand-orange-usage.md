# Brand Orange — Kullanım Haritası (Phase 11D)

Karar: ana turuncu **`#b04a20`** olarak KALIR (WCAG AA gereği) ve bir daha değiştirilmez. Bu doküman, koyu zemin varyantlarının **tam olarak nerede** göründüğünü görsel inceleme için listeler.

## Token'lar (`src/app/globals.css`)

| Token | Değer | Kullanım | Kontrast |
|---|---|---|---|
| `--accent` | `#b04a20` | Açık zeminde metin (`text-accent`), buton zemini (`bg-accent`) | ≥4.7:1 (`#f7f5f2` / `#f3f0ec`), beyaz buton metniyle 5.46:1 |
| `--accent-hover` | `#9c4219` | Buton hover | — |
| `--accent-light` | `#e0703f` | **Yalnızca koyu yüzeylerdeki accent METİN rengi** | 5.73:1 (`#12141f` üzerinde) |
| (sabit) `#8a8a8a` | — | Koyu yüzeylerde `text-neutral-500` yerine | 5.31:1 (`#12141f` üzerinde) |

Uygulama mekanizması (tek yer, `globals.css` sonu):

```css
:is(.bg-surface-dark, .bg-primary, .bg-neutral-950, .bg-neutral-900) .text-accent      { color: var(--accent-light); }
:is(.bg-surface-dark, .bg-primary, .bg-neutral-950, .bg-neutral-900) .text-neutral-500 { color: #8a8a8a; }
```

Yani bileşen kodunda değişiklik yok: bir `text-accent` öğesi bu dört koyu zemin sınıfından birinin **içindeyse** otomatik açık varyantı alır. Yeni koyu bir bölüm eklerken bu sınıflardan birini kullanın (ya da kurala yeni sınıfı ekleyin).

## Render edilen yerler (headless Chrome ile 18 sayfada ölçüldü)

Tarama: `/`, `/urunler`, `/urunler/buyukbas`, `/urunler/kurban-kesim`, `/urun/<slug>`, `/projeler`, `/projeler/<slug>`, `/projeler/c-100`, `/blog`, `/blog/<slug>`, `/hakkimizda`, `/iletisim`, `/kataloglar`, `/kataloglar/<slug>`, `/videolar`, `/hizmetler`, `/hizmetler/<slug>`, `/admin/login`.

### `#e0703f` (açık turuncu, koyu zemin metni) — **yalnızca ana sayfada, 6 yer**

| # | Yer | Öğe | Kaynak dosya |
|---|---|---|---|
| 1 | Ana sayfa **hero** (üst bölüm, koyu) | Küçük başlık/eyebrow "Mezbaha Teknolojileri" | `src/components/home/hero.tsx` (satır ~10, `text-accent`) |
| 2–6 | Ana sayfa **"Projeden Devreye Almaya Tek Muhatap"** bölümü (koyu) | Adım numaraları **01, 02, 03, 04, 05** | `src/components/home/turnkey-solutions.tsx` (satır ~26, `text-accent`) |

Diğer hiçbir sayfada koyu zeminde `text-accent` yok (ölçüm: 0). Not: `/hakkimizda`, `/iletisim` vb. sayfalar açık zeminde `#b04a20` kullanır.

### `#8a8a8a` (açık gri, koyu zemin soluk metin) — **her sayfada aynı 4 yer** (footer)

| Yer | Öğe | Kaynak |
|---|---|---|
| Footer sütun başlığı | "Ürünler" | `src/components/public/footer.tsx` |
| Footer sütun başlığı | "Kurumsal" | `footer.tsx` |
| Footer sütun başlığı | "İletişim" | `footer.tsx` |
| Footer alt satır | "© 2026 Mezbaha Teknolojileri. Tüm hakları saklıdır." | `footer.tsx` |

(Admin giriş sayfasında 0.)

## Ana turuncunun (`#b04a20`) kullanıldığı yerler (bilgi)

Açık zeminde `text-accent` (bölüm eyebrow'ları, numaralar, ürün etiketleri; ~22 kullanım) ve `bg-accent` butonlar (header "İletişim" CTA'sı, hero CTA, final CTA, kategori/ürün CTA'ları; ~7 kullanım). Eski değer `#c85a2e` idi; fark küçük ama görünür ölçüde koyu.

## Görsel inceleme kontrol listesi

1. Ana sayfa hero eyebrow'u koyu zeminde yeterince parlak mı, marka hissi korunuyor mu?
2. "01–05" adım numaraları açık turuncuyla okunaklı mı?
3. Açık zeminde butonlar/eyebrow'lar önceki turuncuya göre fazla koyu mu? (Kabul: hayır ise `--accent` aynı kalır.)
4. Footer başlıkları ve telif satırı okunabilir mi?
