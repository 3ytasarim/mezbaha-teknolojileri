# Görsel Envanteri — public/images/

Kaynak: https://www.mezbahateknolojileri.com/tr/ (canlı site, indirme tarihi: 2026-09-18). Tüm görseller şirketin kendi canlı sitesinden alınmış gerçek fotoğraflardır; stok görsel veya uydurma içerik kullanılmamıştır.

## Önemli teknik not — dosya uzantısı / gerçek format uyuşmazlığı

Canlı sitede `uploads/slider/`, `uploads/services/cover/` ve `uploads/services/images/` altındaki **yeni** yüklenen görseller (2025-2026 tarihli dosya adları) URL'de `.jpg` veya `.webp` uzantısı taşısa ve sunucu `Content-Type: image/webp` / `image/jpeg` header'ı dönse de, **gerçek dosya baytları PNG imzası (`89 50 4E 47`) taşıyor** — yani sitenin görsel işleme/CDN katmanında bir hata var, gerçek format PNG ama uzantı/header yanlış etiketlenmiş. Bu tutarsızlık `curl` ile indirilen ham baytlar üzerinden `xxd`/`file` ile doğrulandı. Bizim repo'da bu dosyaları **gerçek içerikleriyle eşleşen `.png` uzantısıyla** kaydettik (uzantıyı olduğu gibi kopyalamak yerine), aksi halde Next.js statik servis yanlış `Content-Type: image/webp` header'ı ile gerçek PNG baytları dönebilir. Sadece eski galeri görselleri (`uploads/gallery/gallery_images/` — proje fotoğrafları — ve `kosher-line` ürününün 2019 tarihli görselleri) gerçekten JPEG formatında, bunlar `.jpg` olarak bırakıldı.

---

## Hero

| Source URL | Local filename | Used on | Suggested alt text |
|---|---|---|---|
| `https://www.mezbahateknolojileri.com/uploads/slider/slider_1786704071.jpg` | `hero/mezbaha-tesisi-hero.png` (1920×700, gerçek format PNG) | hero | Mezbaha Teknolojileri paslanmaz çelik kesim hattı ve mezbaha tesisi genel görünümü |

## Kategoriler (categories/)

| Source URL | Local filename | Used on | Suggested alt text |
|---|---|---|---|
| `https://www.mezbahateknolojileri.com/uploads/services/cover/buyukbas-mezbaha-makinalari-1786714622.webp` | `categories/buyukbas-mezbaha-makinalari.png` (450×450) | category: buyukbas | Büyükbaş mezbaha makinaları kategori görseli |
| `https://www.mezbahateknolojileri.com/uploads/services/cover/kucukbas-mezbaha-makinalari-1786713549.webp` | `categories/kucukbas-mezbaha-makinalari.png` (450×450) | category: kucukbas | Küçükbaş mezbaha makinaları kategori görseli |
| `https://www.mezbahateknolojileri.com/uploads/services/cover/kurban-kesim-makinalari-1786714749.webp` | `categories/kurban-kesim-makinalari.png` (450×450) | category: kurban-kesim | Kurban kesim makinaları ve sistemleri kategori görseli |
| `https://www.mezbahateknolojileri.com/uploads/services/cover/mezbaha-sistemleri-1786963201.webp` | `categories/mezbaha-sistemleri.png` (450×450) | category: mezbaha-sistemleri | Mezbaha sistemleri kategori görseli |

Not: Bu 4 kapak görseli site anasayfasında kategori kartlarında kullanılan resmi kapak görselleridir (450×450, kare format — homepage kart bileşenine uygun ama büyük hero/banner kullanımı için düşük çözünürlük). Kare kırpım/kompozisyon sebebiyle jenerik ekipman fotoğrafı gibi görünüyorlar; sitede bu 4 kategori için ayrıca geniş/panoramik bir banner görseli tespit edilmedi.

## Ürünler (products/)

| Source URL | Local filename | Used on | Suggested alt text |
|---|---|---|---|
| `https://www.mezbahateknolojileri.com/uploads/services/images/image_1784023207610899.webp` | `products/hidrolik-deri-yuzme-makinasi.png` (1280×1280) | product: hidrolik-deri-yuzme-makinasi | Hidrolik deri yüzme makinası ön görünüm, paslanmaz çelik gövde |
| `https://www.mezbahateknolojileri.com/uploads/services/images/image_1787663326295718.webp` | `products/karkas-bolme-testeresi.png` (1280×1280) | product: karkas-bolme-testeresi (Slim Line) | Karkas bölme testeresi (Slim Line) üretim hattında kullanım görünümü |
| `https://www.mezbahateknolojileri.com/uploads/services/images/image_1575284292843801.jpg` | `products/kosher-line.jpg` (799×450, gerçek JPEG) | product: kosher-line | Kosher Line koşer et tuzlama hattı, tuzlama ve durulama havuzları |
| `https://www.mezbahateknolojileri.com/uploads/services/images/image_1784018300312768.webp` | `products/dairesel-kesim-hucresi.png` (1280×853) | product: dairesel-kesim-hucresi | Dairesel kesim hücresi, büyükbaş kesim işlemi için dönel platform |
| `https://www.mezbahateknolojileri.com/uploads/services/images/image_1787834085288607.webp` | `products/ayak-kesme-makasi.png` (1280×1280) | product: ayak-kesme-makasi | Hidrolik ayak ve boynuz kesme makası, paslanmaz çelik ekipman |

**Bulunamayan / gerçek fotoğrafı olmayan ürün — Kurban Pro:** `/tr/kurban-pro/` sayfası ziyaret edildi ve DOM/CSS background taraması yapıldı; sayfada `/uploads/` altından hiçbir ürün görseli (galeri, arka plan resmi vb.) bulunamadı — sadece pazarlama metni var. Bu yüzden "kurban-pro" için görsel indirilmedi; dürüstçe belirtiliyor, başka bir ürünün fotoğrafı "Kurban Pro" diye etiketlenmedi.

## Projeler (projects/)

| Source URL | Local filename | Used on | Suggested alt text |
|---|---|---|---|
| `https://www.mezbahateknolojileri.com/uploads/gallery/gallery_images/image_1564663160662083.jpg` | `projects/mezbaha-proje-3d-tasarim.jpg` (800×565, gerçek JPEG) | project: proje-3d-tasarim | Mezbaha sistemleri 3D proje tasarım görseli |
| `https://www.mezbahateknolojileri.com/uploads/gallery/gallery_images/image_1564478909218199.jpg` | `projects/kucuk-olcekli-mezbaha-projesi.jpg` (800×800, gerçek JPEG) | project: kucuk-olcekli-proje | Küçük ölçekli mezbaha projesi — yaklaşık 30 büyükbaş ve 50 koyun kapasiteli tesis |
| `https://www.mezbahateknolojileri.com/uploads/gallery/gallery_images/image_1554670221736978.jpg` | `projects/mezbaha-ekipman-fotografi.jpg` (1280×960, gerçek JPEG) | project: mezbaha-ekipman-fotografi | Mezbaha sistemleri ekipman kurulum fotoğrafı |
| `https://www.mezbahateknolojileri.com/uploads/gallery/gallery_images/image_1551617480781854.jpg` | `projects/mezbaha-proje-ornegi.jpg` (1280×719, gerçek JPEG) | project: mezbaha-proje-ornegi | Tamamlanmış mezbaha projesi örneği |

Not: Bu 4 görsel `/tr/proje-resimleri/` sayfasındaki galeriden alınmıştır ("Mezbaha Sistemleri Projeler 3D" — hem 3D tasarım render'ları hem gerçek kurulum/ekipman fotoğrafları karışık şekilde sunuluyor). Galeri toplam 24 görsel içeriyor; bunlardan görsel olarak en ayırt edici ve tekrar etmeyen 4 tanesi seçildi. Galerideki hiçbir görselin ayrı, tıklanabilir proje detay sayfası (`/projeler/[slug]` gibi) yok — hepsi tek bir galeri sayfasında lightbox olarak sunuluyor; bu envanterdeki Bölüm 4-A'da bahsedilen ülke bazlı 17 referans kartının (Hollanda, Azerbaycan, Katar vb.) bu galeri görselleriyle bire bir eşleştiği doğrulanamadı — kartlar ayrı bir bileşen, galeri ayrı bir sayfa.

---

## Özet

- Toplam indirilen görsel: **14** (hero: 1, categories: 4, products: 5, projects: 4)
- Tüm dosyalar gerçek boyut/format doğrulaması yapıldı (`xxd` ile magic byte kontrolü + dosya boyutu > 5KB).
- **Bulunamayan:** Kurban Pro ürünü için gerçek fotoğraf yok (sayfada görsel galerisi mevcut değil).
- **Sınırlama:** Kategori kapak görselleri (categories/) 450×450 kare format — büyük/geniş bir kategori banner'ı için ideal değil, ama sitede bu 4 kategori için başka bir yüksek çözünürlüklü geniş format görsel tespit edilmedi.
