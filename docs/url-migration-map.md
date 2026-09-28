# URL Migration Map — mezbahateknolojileri.com → Yeni Site

Yeni site mimarisi (verilen desen): `/`, `/urunler`, `/urunler/[categorySlug]`, `/urun/[slug]`, `/projeler`, `/projeler/[slug]`, `/blog`, `/blog/[slug]`, `/hakkimizda`, `/iletisim`, `/teklif-al`.

Notlar:
- Tüm eski URL'ler `https://www.mezbahateknolojileri.com` kök alan adına aittir; NEW URL sütunu yeni sitenin göreli yoludur.
- ACTION = **KEEP**: eski URL zaten yeni desenle eşleşiyor veya kavramsal olarak birebir taşınabiliyor (ör. `/tr/` → `/`).
- ACTION = **301**: eski URL yeni desene uymuyor, kalıcı yönlendirme gerekiyor.
- Sayısal son ekli slug'lar (`-673`, `-872`, `-707`, `-876`, `-308`, `-553`, `-941`) yeni sitede temizlenmiştir.
- `/tr/sheep-bleeding-elevator/` için TR slug'a çevrilmiştir (`koyun-kanama-elevatoru`) — İngilizce slug'ın TR site altında kalması hata olarak değerlendirildi.
- `/tr/projeler-553/` yetim/eski bir sayfa olduğu için `/tr/projeler/` ile birlikte tek hedefe (`/projeler`) yönlendirilmesi önerildi.
- Kaynak: `docs/current-site-inventory.md` (bu envanterle birlikte hazırlanmıştır).

---

## 1. Temel Sayfalar

| OLD URL | NEW URL | ACTION | NOTES |
|---|---|---|---|
| `/tr/` | `/` | 301 | Dil öneki kaldırılıyor; TR varsayılan dil olacaksa kök `/` TR içerik olmalı. |
| `/tr/kurumsal/` | `/hakkimizda` | 301 | İsim/URL değişiyor; içerik ana sayfayla aynı metni tekrarlıyor, yeni sitede özgün içerik yazılmalı (bkz. envanter Bölüm 6). |
| `/tr/iletisim/` | `/iletisim` | 301 | Slug zaten uyumlu ama trailing slash kaldırılıyor; form alanları korunmalı (ad-soyad, e-posta, telefon, konu dropdown, mesaj). |
| `/tr/referanslar/` | `/projeler` | 301 | Ayrı bir "referanslar" rotası yeni mimaride yok; içerik `/projeler` listesine entegre edilmeli veya `/projeler` içinde bir filtre/bölüm olarak sunulmalı. |
| `/tr/projeler/` | `/projeler` | 301 | Anahtar teslim kapasite paketleri (C-50...C-300) `/projeler` altında ayrı kartlar olabilir; her paket için `/projeler/[slug]` düşünülebilir (bkz. Bölüm 4). |
| `/tr/projeler-553/` | `/projeler` | 301 | Yetim/eski duplicate sayfa — doğrudan `/projeler`'e yönlendirilmeli, ayrı içerik taşınmamalı. |
| `/tr/satis-agi/` | `/hakkimizda#satis-agi` | 301 | Yeni mimaride ayrı rota yok; Hakkımızda sayfasında bir bölüm ya da ayrı "Küresel Varlık" bileşeni olarak düşünülebilir. |
| `/tr/temsilcilikler/` | `/hakkimizda#temsilcilikler` | 301 | Aynı şekilde; bayi/temsilci listesi için ayrı bir rota planlanmadıysa Hakkımızda veya İletişim sayfasına entegre edilmeli. |
| `/tr/kataloglar/` | `/kataloglar` | 301 | Phase 11D: Kataloglar listesi yeni sitede gerçek sayfa olarak var (kaynak: tek katalog "2018 Mezbaha Sistemleri Katalog"). |
| `/tr/mezbaha-makina-sistemleri-katalog/` | `/kataloglar/2018-mezbaha-sistemleri-katalog` | 301 | Phase 11D: 155 sayfalık görsel katalog (kaynakta PDF değil, sayfa görselleri galerisi) yerel sayfa görselleriyle taşındı. |
| `/tr/endustriyel-sogutma-sistemleri/` | `/hizmetler/endustriyel-sogutma-sistemleri` | 301 | Phase 11D: eski sitede sitemap dışında canlı (200) hizmet sayfası; gerçek metin CMS `Page` (service) olarak taşındı. |
| `/tr/proje-resimleri/` | `/projeler#galeri` | 301 | Ayrı bir medya galerisi rotası yoksa `/projeler` sayfasına bölüm olarak eklenmeli. |
| `/tr/mezbaha-sistemleri-videolar-941/` | `/videolar` | 301 | Phase 11D: 17 YouTube gömmesinden 16'sı yayında; 1 tanesi YouTube'da gizli (eski sitede de oynatılamıyor). |
| `/tr/blog/` | `/blog` | KEEP | Zaten yeni desenle birebir eşleşiyor (sadece trailing slash farkı). |

---

## 2. Ürün Kategorileri

| OLD URL | NEW URL | ACTION | NOTES |
|---|---|---|---|
| `/tr/buyukbas-mezbaha-makinalari/` | `/urunler/buyukbas` | 301 | En kapsamlı kategori (~40 ürün); yeni sitede alt kategorilere bölünmesi önerilir (bkz. envanter Bölüm 9). |
| `/tr/kucukbas-mezbaha-makinalari/` | `/urunler/kucukbas` | 301 | 5 ürün içeriyor. |
| `/tr/kurban-kesim/` | `/urunler/kurban-kesim` | 301 | Uzun SEO metni + Kurban Pro ürünü; bu metin `/urunler/kurban-kesim` kategori açıklaması olarak taşınabilir. |
| `/tr/mezbaha-sistemleri/` | `/urunler/mezbaha-sistemleri` | 301 | 5 alt sistemi kapsıyor (profesyonel, standart, soğuk oda ikizray, bina dizaynı, kosher line). |
| — (yeni, mevcutta yok) | `/urunler` | — | Tüm kategorileri listeleyen üst sayfa; eski sitede doğrudan karşılığı yok (ÜRÜNLER menüsü sadece dropdown). |

---

## 3. Bireysel Ürünler

| OLD URL | NEW URL | ACTION | NOTES |
|---|---|---|---|
| `/tr/dairesel-kesim-hucresi/` | `/urun/dairesel-kesim-hucresi` | KEEP* | *Slug aynı kalıyor, sadece `/urun/` öneki ekleniyor → teknik olarak 301 gerekir. |
| `/tr/ayakta-kesim-hucresi/` | `/urun/ayakta-kesim-hucresi` | 301 | |
| `/tr/mezbaha-sistemleri-klasik-kesim-hucresi/` | `/urun/klasik-kesim-hucresi` | 301 | Slug sadeleştirildi. |
| `/tr/hidrolik-deri-yuzme-makinasi/` | `/urun/hidrolik-deri-yuzme-makinasi` | 301 | |
| `/tr/mekanik-deri-yuzme-673/` | `/urun/mekanik-deri-yuzme` | 301 | Sayısal son ek temizlendi. |
| `/tr/karkas-bolme-testeresi/` | `/urun/karkas-bolme-testeresi` | 301 | |
| `/tr/dos-acma-testeresi/` | `/urun/dos-acma-testeresi` | 301 | |
| `/tr/ayak-kesme-makasi/` | `/urun/ayak-kesme-makasi` | 301 | |
| `/tr/mezbaha-makinalari-et-yukleme-kolu/` | `/urun/et-yukleme-kolu` | 301 | Slug sadeleştirildi. |
| `/tr/ceyrekleme-elevatoru-872/` | `/urun/ceyrekleme-elevatoru` | 301 | Sayısal son ek temizlendi. |
| `/tr/aktarma-platformu/` | `/urun/aktarma-platformu` | 301 | |
| `/tr/pnomatik-iskembe-platformu-707/` | `/urun/pnomatik-iskembe-platformu` | 301 | Sayısal son ek temizlendi. |
| `/tr/kancalar/` | `/urun/kancalar` | 301 | |
| `/tr/mezbaha-sistemleri-monray-ikizray/` | `/urun/monray-ikizray` | 301 | Slug sadeleştirildi. |
| `/tr/iskembe-atik-pompasi/` | `/urun/iskembe-atik-pompasi` | 301 | |
| `/tr/testere-sterilizatorleri/` | `/urun/testere-sterilizatorleri` | 301 | |
| `/tr/kanama-vinci-876/` | `/urun/kanama-vinci` | 301 | Sayısal son ek temizlendi. |
| `/tr/sigir-kanama-elevatoru/` | `/urun/sigir-kanama-elevatoru` | 301 | |
| `/tr/sigir-isleme-hatti-otomatik/` | `/urun/sigir-isleme-hatti` | 301 | |
| `/tr/koyun-isleme-konveyoru/` | `/urun/koyun-isleme-konveyoru` | 301 | |
| `/tr/ciger-konveyoru-308/` | `/urun/ciger-konveyoru` | 301 | Sayısal son ek temizlendi. |
| `/tr/sheep-bleeding-elevator/` | `/urun/koyun-kanama-elevatoru` | 301 | İngilizce slug TR'ye çevrildi (bkz. envanter Bölüm 9). |
| `/tr/mezbaha-lavabolari/` | `/urun/mezbaha-lavabolari` | 301 | |
| `/tr/cizme-yikama-istasyonu/` | `/urun/cizme-yikama-istasyonu` | 301 | |
| `/tr/cizme-askiligi/` | `/urun/cizme-askiligi` | 301 | |
| `/tr/ayak-yikama-makinasi/` | `/urun/ayak-yikama-makinasi` | 301 | |
| `/tr/beyin-cikarma-makinasi/` | `/urun/beyin-cikarma-makinasi` | 301 | |
| `/tr/deri-temizleme-tavasi/` | `/urun/deri-temizleme-tavasi` | 301 | |
| `/tr/iskembe-temizleme-tavasi/` | `/urun/iskembe-temizleme-tavasi` | 301 | |
| `/tr/ic-organ-tasima-arabasi/` | `/urun/ic-organ-tasima-arabasi` | 301 | |
| `/tr/ciger-temizleme-tavasi/` | `/urun/ciger-temizleme-tavasi` | 301 | |
| `/tr/kurutmali-kan-tanki/` | `/urun/kurutmali-kan-tanki` | 301 | |
| `/tr/sersemletme-ekipmani/` | `/urun/sersemletme-ekipmani` | 301 | |
| `/tr/sabit-kuyruk-acma-platformu/` | `/urun/sabit-kuyruk-acma-platformu` | 301 | |
| `/tr/sabit-aktarma-platformu/` | `/urun/sabit-aktarma-platformu` | 301 | |
| `/tr/sabit-icorgan-platformu/` | `/urun/sabit-icorgan-platformu` | 301 | |
| `/tr/et-parcalama-masasi/` | `/urun/et-parcalama-masasi` | 301 | |
| `/tr/aktarma-vinci/` | `/urun/aktarma-vinci` | 301 | |
| `/tr/kanca-geri-donus/` | `/urun/kanca-geri-donus` | 301 | |
| `/tr/ayak-germe-ve-kilitleme/` | `/urun/ayak-germe-ve-kilitleme` | 301 | |
| `/tr/kanama-kancasi/` | `/urun/kanama-kancasi` | 301 | |
| `/tr/ikizray-kanca/` | `/urun/ikizray-kanca` | 301 | |
| `/tr/deri-bant-konveyoru/` | `/urun/deri-bant-konveyoru` | 301 | |
| `/tr/kanal-ve-izgara/` | `/urun/kanal-ve-izgara` | 301 | |
| `/tr/kanama-tavasi/` | `/urun/kanama-tavasi` | 301 | |
| `/tr/kanca-tasima-arabasi/` | `/urun/kanca-tasima-arabasi` | 301 | |
| `/tr/ciger-tasima-arabasi/` | `/urun/ciger-tasima-arabasi` | 301 | |
| `/tr/kan-tanki/` | `/urun/kan-tanki` | 301 | |
| `/tr/sakatat-askisi/` | `/urun/sakatat-askisi` | 301 | |
| `/tr/profesyonel-mezbaha-sistemleri/` | `/urun/profesyonel-mezbaha-sistemleri` | 301 | Kavramsal olarak "sistem" ama tek ürün sayfası gibi davranıyor, `/urun/` altına alındı. |
| `/tr/standart-mezbaha-sistemleri/` | `/urun/standart-mezbaha-sistemleri` | 301 | |
| `/tr/soguk-oda-ikizray-sistemleri/` | `/urun/soguk-oda-ikizray-sistemleri` | 301 | |
| `/tr/mezbaha-bina-dizayni/` | `/urun/mezbaha-bina-dizayni` | 301 | Bu bir hizmet/danışmanlık sayfasına da dönüştürülebilir (`/hizmetler/...`), ancak yeni mimaride ayrı bir hizmetler rotası tanımlı değil; şimdilik `/urun/` altında tutuldu. |
| `/tr/kosher-line/` | `/urun/kosher-line` | 301 | |
| `/tr/kurban-pro/` | `/urun/kurban-pro` | 301 | |

\* `dairesel-kesim-hucresi` slug'ı değişmese bile URL yolu (`/tr/...` → `/urun/...`) değiştiği için teknik olarak 301 gerekir; tablo tutarlılığı için bu satır da 301 kabul edilmelidir (KEEP notu yalnızca slug metninin aynı kaldığını vurgular).

---

## 4. Projeler / Referans İçerikleri

| OLD URL | NEW URL | ACTION | NOTES |
|---|---|---|---|
| `/tr/projeler/` (C-50, C-50 Plus, C-100, C-100 Plus, C-100 XL, C-200, C-300 paketleri) | `/projeler` + her paket için `/projeler/c-50`, `/projeler/c-50-plus`, `/projeler/c-100`, `/projeler/c-100-plus`, `/projeler/c-100-xl`, `/projeler/c-200`, `/projeler/c-300` | 301 | Eski sitede bu paketlerin ayrı URL'si yok (tek sayfada bölüm bölüm); yeni sitede her paketin kendi `/projeler/[slug]` sayfası olması önerilir — bu içerik zenginleştirmesi, "uydurma" değil mevcut metnin yeniden yapılandırılmasıdır. |
| Ana sayfadaki uluslararası proje kartları (Hollanda, Azerbaycan, Katar, vb. — bkz. envanter Bölüm 4A) | `/projeler/[ulke-sehir-slug]` (ör. `/projeler/hollanda-harderwijk`) | 301 (varsayımsal) | **Doğrulanmadı**: bu kartların eski sitede tıklanabilir ayrı bir detay URL'si olup olmadığı teyit edilemedi. Eğer yoksa bu bir 301 değil, yeni içerik oluşturma (migration değil, content creation) olur — geliştirme öncesi netleştirilmeli. |
| `/tr/referanslar/` (61 müşteri/tesis isim listesi, URL'siz düz metin) | `/projeler` (liste/filtre bölümü olarak) | 301 | Bu veri URL'siz olduğu için birebir 301 haritalaması yok; içerik yeni `/projeler` sayfasında bir "Referanslarımız" listesi olarak sunulabilir. |

---

## 5. Blog Yazıları

Blog yazıları eski sitede düz `/tr/[slug]/` yapısındaydı; yeni sitede `/blog/[slug]` altına taşınıyor. Slug metinleri korunmuştur (SEO değeri taşıyan uzun, açıklayıcı slug'lar olduğu için değiştirilmedi).

| OLD URL | NEW URL | ACTION | NOTES |
|---|---|---|---|
| `/tr/rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir/` | `/blog/rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir` | 301 | |
| `/tr/otomatik-deri-yuzme-sistemleri-ile-iscilik-maliyeti-nasil-azalir/` | `/blog/otomatik-deri-yuzme-sistemleri-ile-iscilik-maliyeti-nasil-azalir` | 301 | |
| `/tr/karkas-tasima-sistemleri-et-kalitesini-nasil-etkiler/` | `/blog/karkas-tasima-sistemleri-et-kalitesini-nasil-etkiler` | 301 | |
| `/tr/et-parcalama-testereleri-hizli-ve-guvenli-kesim-ekipmanlari/` | `/blog/et-parcalama-testereleri-hizli-ve-guvenli-kesim-ekipmanlari` | 301 | |
| `/tr/dos-acma-testeresi-ile-hizli-ve-hijyenik-kesim-icin-ipuclari/` | `/blog/dos-acma-testeresi-ile-hizli-ve-hijyenik-kesim-icin-ipuclari` | 301 | |
| `/tr/hidrolik-deri-yuzme-makinasi-mi-mekanik-deri-yuzme-makinasi-mi/` | `/blog/hidrolik-deri-yuzme-makinasi-mi-mekanik-deri-yuzme-makinasi-mi` | 301 | |
| `/tr/ayak-kesme-makasi-avantajlari/` | `/blog/ayak-kesme-makasi-avantajlari` | 301 | |
| `/tr/robotik-mezbaha-sistemleri-nedir/` | `/blog/robotik-mezbaha-sistemleri-nedir` | 301 | |
| `/tr/soguk-oda-ve-ikizray-sistemleri-et-kalitesini-nasil-etkiler/` | `/blog/soguk-oda-ve-ikizray-sistemleri-et-kalitesini-nasil-etkiler` | 301 | |
| `/tr/iskembe-atik-pompasi-ile-atik-yonetimi/` | `/blog/iskembe-atik-pompasi-ile-atik-yonetimi` | 301 | |
| `/tr/buyukbas-sersemletme-sistemleri/` | `/blog/buyukbas-sersemletme-sistemleri` | 301 | |
| `/tr/mezbahane-teknolojik-ekipmanlar/` | `/blog/mezbahane-teknolojik-ekipmanlar` | 301 | |
| `/tr/mezbaha-kullanmaya-gecmenin-finansal-avantajlari/` | `/blog/mezbaha-kullanmaya-gecmenin-finansal-avantajlari` | 301 | |
| `/tr/et-kalitesini-artiran-mezbaha-uygulamalari/` | `/blog/et-kalitesini-artiran-mezbaha-uygulamalari` | 301 | |
| `/tr/kesim-oncesi-hayvan-stresi-azaltma/` | `/blog/kesim-oncesi-hayvan-stresi-azaltma` | 301 | |
| `/tr/devlet-tesvigi-ile-mezbaha-kurmak/` | `/blog/devlet-tesvigi-ile-mezbaha-kurmak` | 301 | |
| `/tr/mezbaha-tasariminda-hayvan-refahi-koruma/` | `/blog/mezbaha-tasariminda-hayvan-refahi-koruma` | 301 | |
| `/tr/mezbaba-kurmak-ne-kadar-surer/` | `/blog/mezbaha-kurmak-ne-kadar-surer` | 301 | Eski slug'da yazım hatası var ("mezbaba"); yeni slug'da düzeltildi. |
| `/tr/kesimhanelerde-enerji-tasarrufu-saglama/` | `/blog/kesimhanelerde-enerji-tasarrufu-saglama` | 301 | |
| `/tr/modern-mezbaha-ekipmanlari-nelerdir/` | `/blog/modern-mezbaha-ekipmanlari-nelerdir` | 301 | |
| `/tr/mezbaha-kurulumunda-hangi-belgeler-gereklidir/` | `/blog/mezbaha-kurulumunda-hangi-belgeler-gereklidir` | 301 | |
| `/tr/mezbaha-hijyeni-nasil-saglanir/` | `/blog/mezbaha-hijyeni-nasil-saglanir` | 301 | |
| `/tr/kucukbas-buyukbas-mezbaha-farki/` | `/blog/kucukbas-buyukbas-mezbaha-farki` | 301 | |
| `/tr/mezbaha-kurulum-maliyeti/` | `/blog/mezbaha-kurulum-maliyeti` | 301 | |
| `/tr/mezbaha-otomasyonu-verimlilik-artisi/` | `/blog/mezbaha-otomasyonu-verimlilik-artisi` | 301 | |
| `/tr/modern-mezbaha-sistemleri-nedir/` | `/blog/modern-mezbaha-sistemleri-nedir` | 301 | |
| `/tr/sigir-kesiminde-en-sik-kullanilan-makineler-nelerdir/` | `/blog/sigir-kesiminde-en-sik-kullanilan-makineler-nelerdir` | 301 | |
| `/tr/modern-makinelerle-bir-hayvanin-islenmesi-ne-kadar-surer/` | `/blog/modern-makinelerle-bir-hayvanin-islenmesi-ne-kadar-surer` | 301 | |
| `/tr/mezbaha-makineleri-et-kalitesini-etkiler-mi/` | `/blog/mezbaha-makineleri-et-kalitesini-etkiler-mi` | 301 | |
| `/tr/kucuk-ciftlikler-mezbaha-makineleri-kullanabilir-mi/` | `/blog/kucuk-ciftlikler-mezbaha-makineleri-kullanabilir-mi` | 301 | |
| `/tr/mezbahalarda-kullanilan-makineler-guvenli-mi/` | `/blog/mezbahalarda-kullanilan-makineler-guvenli-mi` | 301 | |
| `/tr/online-magazamiz-yayinda/` | `/blog/online-magazamiz-yayinda` | 301 | Duyuru yazısı, rehber değil; aynı içerik yazı olarak taşındı (Phase 11C: eski sayfa incelendi — harici bir online satış sitesini duyuran kısa duyuru; 1:1 karşılık mevcut). Harici mağaza linkinin güncelliği editoryal olarak gözden geçirilmeli. |

---

## 6. Yeni Sitede Karşılığı Olmayan Kavramlar (Ek Notlar)

Aşağıdakiler mevcut sitede var ama verilen yeni URL deseninde (`/`, `/urunler`, `/urunler/[cat]`, `/urun/[slug]`, `/projeler`, `/projeler/[slug]`, `/blog`, `/blog/[slug]`, `/hakkimizda`, `/iletisim`, `/teklif-al`) doğrudan bir karşılığı yok. PM/mimariyle netleştirilmesi önerilir:

- **Kataloglar / PDF indirme** (`/tr/kataloglar/`, `/tr/mezbaha-makina-sistemleri-katalog/`) — ayrı bir `/kataloglar` rotası eklenmesi ya da `/teklif-al` akışına "katalog indir" CTA'sı olarak entegre edilmesi önerilir.
- **Satış Ağı / Temsilcilikler** (`/tr/satis-agi/`, `/tr/temsilcilikler/`) — B2B/ihracat odaklı bu firma için önemli bir güven sinyali; `/hakkimizda` içinde bölüm veya ayrı `/global` gibi bir rota düşünülebilir.
- **Video galerisi** (`/tr/mezbaha-sistemleri-videolar-941/`) — ayrı rota yoksa ana sayfa veya `/projeler` içine gömülmeli.
- **Proje resimleri / 3D galeri** (`/tr/proje-resimleri/`) — `/projeler` sayfasında medya bölümü olarak taşınabilir.
- **Kurban kesim, tek başına kategori mi yoksa mevsimsel kampanya sayfası mı olmalı** — mevcut sitede kalıcı bir kategori olarak var (`/tr/kurban-kesim/`), yeni sitede de `/urunler/kurban-kesim` olarak kalıcı kategori tutuldu, ancak PM ile mevsimsellik (kurban bayramı öncesi kampanya) açısından ayrıca değerlendirilebilir.

---

## 7. Özet Sayılar

- Toplam eski URL (sitemap-tr.xml + nav'da bulunan ama sitemap'te olmayan sayfalar): **~96**
- Ürün kategorisi: **4**
- Bireysel ürün/alt-sistem sayfası: **~55**
- Blog yazısı: **32**
- Kurumsal/yardımcı sayfa: **~13** (kurumsal, iletişim, referanslar, projeler, projeler-553, satış ağı, temsilcilikler, kataloglar, katalog detay, proje resimleri, videolar, blog listesi, ana sayfa)
- KEEP olarak işaretlenen: **1** (`/tr/blog/` → `/blog`, sadece trailing slash farkı)
- 301 olarak işaretlenen: **kalan tüm URL'ler**
