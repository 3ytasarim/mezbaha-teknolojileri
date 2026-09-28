# Mevcut Site Envanteri — mezbahateknolojileri.com

Kaynak: https://www.mezbahateknolojileri.com/tr/ (canlı site, ziyaret tarihi: 2026-09-18)
Yöntem: `sitemap.xml` (sitemap index → sitemap-tr.xml / sitemap-en.xml / sitemap-ru.xml / sitemap-images.xml) + tarayıcı ile manuel gezinme (header/footer nav, kategori sayfaları, ürün sayfaları, blog listesi).

Bu belge, yeni site inşa edilmeden önce mevcut gerçek içeriğin dökümüdür. Burada listelenmeyen hiçbir şirket bilgisi, sertifika, istatistik veya iddia **uydurulmamıştır** — doğrulanamayan her yer açıkça belirtilmiştir.

---

## 1. Navigasyon Yapısı

### Header (TR)
```
KURUMSAL            → /tr/kurumsal/
ÜRÜNLER (dropdown)  → /tr/#/  (kendisi tıklanamaz, sadece açılır menü)
  ├─ BÜYÜKBAŞ MEZBAHA MAKİNALARI   → /tr/buyukbas-mezbaha-makinalari/
  ├─ KÜÇÜKBAŞ MEZBAHA MAKİNALARI   → /tr/kucukbas-mezbaha-makinalari/
  ├─ KURBAN KESİM MAKİNALARI       → /tr/kurban-kesim/
  └─ MEZBAHA SİSTEMLERİ            → /tr/mezbaha-sistemleri/
PROJELER             → /tr/projeler/
REFERANSLAR          → /tr/referanslar/
KATALOGLAR           → /tr/kataloglar/
İLETİŞİM              → /tr/iletisim/
```
Üst şerit (topbar): "Satış Ağı" (`/tr/satis-agi/`) ve "Mezbaha Sistemleri Temsilciliklerimiz" (`/tr/temsilcilikler/`) linkleri.

### Footer (TR)
**BAĞLANTILAR:** Mezbaha Sistemleri, Referanslar, Projeler, Kataloglar, Kurumsal, **Blog** (`/tr/blog/` — header'da yok, sadece footer'da), İletişim.
**Ürünlerimiz (kısayollar):** Karkas Bölme Testeresi, Mezbahane Ekipmanları, Ayak Kesme Makası, Kesimhane Ray Sistemleri, Mezbaha Kancası, Döş Açma Testeresi, Deri Yüzme Makinesi, İşkembe Temizleme Makinası.
**Sosyal medya:** Facebook, Twitter, Instagram, LinkedIn, YouTube (ikon linkleri sayfada var; gerçek hesap URL'leri doğrulanmadı — read_page ile href kontrol edilmedi, gerekirse ayrıca teyit edilmeli).
**İletişim bilgileri footer'da tekrarlanıyor** (bkz. Bölüm 7).
**Telif:** "2026 © Mezbaha Teknolojileri ... Her Hakkı Saklıdır." (not: "2026" tarihi muhtemelen sunucu tarihine göre otomatik üretiliyor).

### Önemli tutarsızlık — sitemap ile canlı nav farkı
`sitemap-tr.xml` içinde **görünmeyen** ama site içi header/footer linklerinde **var olan** URL'ler:
- `/tr/iletisim/` (İletişim / Contact)
- `/tr/projeler/` (Projeler ana sayfası — anahtar teslim proje paketleri)
- `/tr/kataloglar/` (Kataloglar listesi)
- `/tr/temsilcilikler/` (Temsilcilikler/bayiler)
- `/tr/blog/` (Blog listesi)

Buna karşılık sitemap'te olan ama nav'da doğrudan linklenmeyen `/tr/projeler-553/` sayfası, `/tr/projeler/` ile neredeyse aynı giriş metnini taşıyan ama içeriği boş/eksik bir **yetim (orphan) sayfa** gibi görünüyor — muhtemelen eski bir slug, CMS tarafından sitemap'e hâlâ dahil ediliyor. Yeni sitede bu tür yetim URL'ler taşınmamalı, 301 ile ana `/projeler` sayfasına yönlendirilmeli.

Ayrıca sitemap'teki bazı `<lastmod>` değerleri anlamsız uzak gelecek tarihleri içeriyor (ör. `8999-09-18`, `8643-09-18`, `7517-09-18`, `5463-09-18`, `3682-09-18`, `6745-09-18`). Bu açıkça bir CMS/tarih alanı hatası — gerçek bir yayın tarihi değil, bu yüzden içerik tazelik analizi için güvenilmemeli.

---

## 2. Ürün Kategorileri

Site "ÜRÜNLER" başlığı altında **4 ana kategori** sunuyor:

| Kategori | URL | İçerik özeti |
|---|---|---|
| Büyükbaş Mezbaha Makinaları | `/tr/buyukbas-mezbaha-makinalari/` | ~40 ürünü tek sayfada listeleyen en kapsamlı kategori (fiilen "tüm ürünler" gibi çalışıyor). Ayrıca uzun SEO metni içeriyor (kesim hücreleri, taşıma hatları, otomasyon vb. hakkında). |
| Küçükbaş Mezbaha Makinaları | `/tr/kucukbas-mezbaha-makinalari/` | Sadece 5 ürün: Koyun İşleme Konveyörü, Koyun Kanama Elevatörü, İç Organ Taşıma Arabası, Kanca Taşıma Arabası, Ciğer Taşıma Arabası. |
| Kurban Kesim Makinaları | `/tr/kurban-kesim/` | Uzun SEO makalesi (kurban kesim yeri projesi, ekipmanlar, otomatik kurban kesim kabinleri) + tek öne çıkan ürün: **Kurban Pro**. |
| Mezbaha Sistemleri | `/tr/mezbaha-sistemleri/` | 5 alt sistem: Profesyonel Mezbaha Sistemleri, Standart Mezbaha Sistemleri, Soğuk Oda İkizray Sistemleri, Mezbaha Bina Dizaynı, Kosher Line. |

Not: Kategoriler arasında net bir taksonomi ayrımı yok — "Büyükbaş" kategorisi pratikte site genelindeki tüm ürünleri tek listede gösteriyor. Yeni sitede daha temiz bir kategori/alt-kategori ayrımı (ör. Kesim Hücreleri, Deri Yüzme, Taşıma & Ray Sistemleri, Kancalar, Hijyen Ekipmanları, Kurban Sistemleri, Koşer Hat) önerilir.

---

## 3. Bireysel Ürünler

Aşağıdaki tüm URL'ler `sitemap-tr.xml`'de doğrulanmıştır. Ürün sayfası şablonu (örneklenen sayfalardan): başlık, pazarlama metni (özellik listesi/madde işaretleri), "Teklif İste" CTA butonu, ürün görselleri galerisi (resim başlıklarıyla). **Çoğu üründe ölçülebilir teknik spesifikasyon (kapasite, güç, ağırlık, ölçü) YOK** — pazarlama diliyle yazılmış metinler hakim. İstisnalar: Kosher Line (100 karkas/saat, 3 tuzlama havuzu + 1 durulama havuzu) ve Kurban Pro / Kurban Kesim (3 m genişlik × 16 m uzunluk + 4 m parçalama hattı) gibi birkaç sayfada somut ölçüler var.

### Kesim hücreleri / ana hat
- `/tr/dairesel-kesim-hucresi/` — Dairesel Kesim Hücresi
- `/tr/ayakta-kesim-hucresi/` — Ayakta Kesim Hücresi
- `/tr/mezbaha-sistemleri-klasik-kesim-hucresi/` — Klasik / Sığır Kesim Hücresi

### Deri yüzme
- `/tr/hidrolik-deri-yuzme-makinasi/` — Hidrolik Deri Yüzme Makinası (örneklendi; paslanmaz çelik, çift yönlü işlem, bağımsız platform kontrolü, hidrolik/pnömatik seçenek)
- `/tr/mekanik-deri-yuzme-673/` — Mekanik Deri Yüzme

### Testereler / kesme ekipmanları
- `/tr/karkas-bolme-testeresi/` — Karkas Bölme Testeresi (Slim Line)
- `/tr/dos-acma-testeresi/` — Döş Açma Testeresi
- `/tr/ayak-kesme-makasi/` — Ayak Kesme Makası
- `/tr/testere-sterilizatorleri/` — Testere Sterilizatörleri

### Taşıma / aktarma / elevatör
- `/tr/mezbaha-makinalari-et-yukleme-kolu/` — Et Yükleme Kolu
- `/tr/ceyrekleme-elevatoru-872/` — Çeyrekleme Elevatörü
- `/tr/aktarma-platformu/` — Aktarma Platformu
- `/tr/pnomatik-iskembe-platformu-707/` — Pnömatik İç Organ / İşkembe Platformu
- `/tr/mezbaha-sistemleri-monray-ikizray/` — Monray / İkizray Sistemleri
- `/tr/aktarma-vinci/` — Aktarma Vinci
- `/tr/sabit-aktarma-platformu/` — Sabit Aktarma Platformu
- `/tr/sabit-icorgan-platformu/` — Sabit İç Organ Platformu
- `/tr/sabit-kuyruk-acma-platformu/` — Sabit Kuyruk Açma Platformu
- `/tr/kanca-geri-donus/` — Kanca Geri Dönüş
- `/tr/kanca-tasima-arabasi/` — Kanca Taşıma Arabası
- `/tr/ic-organ-tasima-arabasi/` — İç Organ Taşıma Arabası
- `/tr/ciger-tasima-arabasi/` — Ciğer Taşıma Arabası
- `/tr/deri-bant-konveyoru/` — Deri Bant Konveyörü

### Kancalar
- `/tr/kancalar/` — Kancalar (genel)
- `/tr/kanama-kancasi/` — Kanama Kancası
- `/tr/ikizray-kanca/` — İkizray Kanca

### Kanama ekipmanları
- `/tr/kanama-vinci-876/` — Kanama Vinci
- `/tr/sigir-kanama-elevatoru/` — Sığır Kanama Elevatörü
- `/tr/kanama-tavasi/` — Kanama Tavası
- `/tr/sheep-bleeding-elevator/` — Koyun Kanama Elevatörü (**dikkat: slug İngilizce ama sayfa `/tr/` altında** — tutarsız URL adlandırması, küçükbaş kategorisinde listeleniyor)

### Sığır / koyun işleme hatları
- `/tr/sigir-isleme-hatti-otomatik/` — Sığır İşleme Hattı (Otomatik)
- `/tr/koyun-isleme-konveyoru/` — Koyun İşleme Konveyörü
- `/tr/ciger-konveyoru-308/` — Ciğer Konveyörü

### Hijyen / temizlik ekipmanları
- `/tr/mezbaha-lavabolari/` — Mezbaha Lavaboları
- `/tr/cizme-yikama-istasyonu/` — Çizme Yıkama İstasyonu
- `/tr/cizme-askiligi/` — Çizme Askılığı
- `/tr/ayak-yikama-makinasi/` — Ayak Yıkama Makinası
- `/tr/deri-temizleme-tavasi/` — Deri Temizleme Tavası
- `/tr/iskembe-temizleme-tavasi/` — İşkembe Temizleme Tavası
- `/tr/ciger-temizleme-tavasi/` — Ciğer Temizleme Tavası

### Diğer ekipmanlar
- `/tr/beyin-cikarma-makinasi/` — Beyin Çıkarma Makinası
- `/tr/kurutmali-kan-tanki/` — Kurutmalı Kan Tankı
- `/tr/kan-tanki/` — Kan Tankı
- `/tr/sersemletme-ekipmani/` — Sersemletme Ekipmanı
- `/tr/iskembe-atik-pompasi/` — İşkembe Atık Pompası
- `/tr/et-parcalama-masasi/` — Et Parçalama Masası
- `/tr/ayak-germe-ve-kilitleme/` — Ayak Germe ve Kilitleme
- `/tr/kanal-ve-izgara/` — Kanal ve Izgara
- `/tr/sakatat-askisi/` — Sakatat Askısı

### Sistemler / özel hatlar (Mezbaha Sistemleri kategorisi altında)
- `/tr/profesyonel-mezbaha-sistemleri/` — Profesyonel Mezbaha Sistemleri
- `/tr/standart-mezbaha-sistemleri/` — Standart Mezbaha Sistemleri
- `/tr/soguk-oda-ikizray-sistemleri/` — Soğuk Oda İkizray Sistemleri
- `/tr/mezbaha-bina-dizayni/` — Mezbaha Bina Dizaynı
- `/tr/kosher-line/` — Kosher Line (örneklendi: 100 karkas/saat kapasite, 3 tuzlama havuzu, 1 durulama havuzu, entegre duş kabini, kasap platformu, hız kontrol ünitesi, oda boyutuna özel kurulum)

### Kurban kesim
- `/tr/kurban-pro/` — Kurban Pro (örneklendi: komple sistem, 3 m genişlik × 16 m uzunluk + 4 m parçalama hattı; Kurban Kesim kategorisi altında breadcrumb ile listeleniyor)

**Toplam bireysel ürün/alt-sistem URL sayısı: ~55**

---

## 4. Projeler / Referanslar

Sitede **iki ayrı ve birbirinden farklı** "proje" kavramı var — yeni sitede bunları netleştirmek gerekecek:

### A) Ana sayfa "proje" kartları (uluslararası referans projeler, ülke bazlı)
Ana sayfada ve muhtemelen `/tr/referanslar/` benzeri bir görsel galeri olarak sunulan, ülke/şehir/kapasite bilgisi içeren kartlar (İngilizce metinlerle, muhtemelen ayrı bir "References" bileşeni). Ana sayfada görülen 17 örnek:

| Ülke | Şehir | Tip | Kapasite |
|---|---|---|---|
| Hollanda | Harderwijk | Slaughterhouse | 180 sheep/hour |
| Azerbaycan | Gobustan | Slaughterhouse | 150 cattle, 1500 sheep |
| Katar | Al Khoor | Slaughterhouse | 100 cattle/shift |
| Porto Riko | San Juan | Rotation Cattle Box | 60 cattle/hour |
| Fas | Kenitra | Modern Slaughterhouse | 500 cattle, 3000 sheep |
| Kırgızistan | Karakol | Slaughterhouse | 200 cattle, 1500 sheep |
| Gürcistan | Khashuri | Slaughterhouse | 25 cattle, 25 pig |
| Türkmenistan | Aşkabat | Slaughterhouse | 100 cattle, 300 sheep |
| Arjantin | Buenos Aires | Leather Skinning | 100 cattle/hour |
| Azerbaycan | Bakü | Meat Processing | 200 cattle, 400 sheep |
| Türkiye | Çorum | Slaughterhouse | 700 cattle, 3000 sheep |
| Bosna Hersek | Prijedor | Rotational Cattle Box | 60 cattle/hour |
| Arnavutluk | Pogradec | Micro Slaughterhouse | 50 cattle |
| Kırgızistan | Bişkek | Meat Processing Cold Room | 50 carcass |
| Azerbaycan | Xaçmaz | Slaughterhouse | 100 cattle, 300 sheep |
| Azerbaycan | Novhani | Slaughterhouse | 50 cattle, 100 sheep |
| Türkiye | Afyon | Slaughterhouse | 700 cattle, 2000 sheep |
| Azerbaycan | Tovuz | Slaughterhouse | 100 cattle, 300 sheep |
| Tacikistan | Duşanbe | Meat Factory | 2000 kg/hour |

Not: Bu kartların ayrı, tek tek proje detay URL'leri olup olmadığı doğrulanamadı — ana sayfada blok/kart formatında görünüyorlar, tıklanabilir bireysel URL'lere read_page ile erişilmedi (zaman kısıtı nedeniyle her kart ayrı ayrı denenmedi). Yeni site için bu veriler `/projeler/[slug]` altında ayrı sayfalar olarak modellenebilir, ancak gerçek her proje için ayrı bir mevcut URL'nin var olup olmadığı teyit edilmemiştir — **bu nokta doğrulanmalı**.

### B) `/tr/projeler/` sayfası — Anahtar teslim "kapasite paketleri"
Bu, ülke referanslarından tamamen farklı bir içerik: Türkiye'deki kesimhaneler için hazır kapasite paketleri, tek sayfada art arda listeleniyor (ayrı URL'leri yok, aynı sayfada bölüm bölüm):
- **C-50**: ~350 m², 50 büyükbaş + 100 koyun kapasiteli kompakt kesimhane
- **C-50 Plus**: 400 m², 70 büyükbaş + 200 küçükbaş
- **C-100**: 550 m², 100 büyükbaş + 300 küçükbaş, 2 soğuk oda
- **C-100 Plus**: 680 m², 100 büyükbaş + 300 küçükbaş, et parçalama odası dahil
- **C-100 XL**: 980 m², 150 büyükbaş + 500 küçükbaş
- **C-200**: 1200 m², 200 büyükbaş + 700 küçükbaş
- **C-300**: 2700 m², 300 büyükbaş + 2000 küçükbaş, 4 soğuk oda
- (Sayfa daha fazla paket içerebilir; 6000 karakter sonrası kesildi — tam liste teyit edilmedi, muhtemelen C-300'den büyük paketler de var.)

Her paket için: video, iç görünüş fotoğrafı, dış tasarım görseli, makina yerleşim planı gibi medya referansları var (gömülü video/görsel, ayrı URL değil).

### C) `/tr/referanslar/` — Müşteri/tesis isim listesi
Sadece **düz metin liste** (URL yok, link yok), 61 referans: çoğunlukla Türkiye'den belediye mezbahaları, özel et tesisleri ve Migros monoray depoları. Örnekler: Çorum Belediye Mezbahası, Bayburt Belediye Mezbahası, Erzurum Et ve Süt Kurumu, Migros Toptan Monoray (Bursa/Hadımköy/Gebze/Ankara/Serik), Sakarya Et Entegre Tesisi, vb. Ayrıca 1 uluslararası: Adal Azyk Ltd (Kırgızistan), Tovuz Agro (Azerbaycan), Ajamy Aria Construction (Afganistan), Angel Ltd Mezbahası (Gürcistan), Pimak Türkmenbaşı Kesimhanesi (Türkmenistan).

### D) `/tr/proje-resimleri/` — 3D proje görselleri / fotoğraf galerisi
Başlık: "Mezbaha Sistemleri Projeler 3D". Görsel galerisi (görsel başlıkları: "Slaughterhouse project 3d", "modern mezbaha sistemleri", "rotational cattle box" vb.). Bir görsel notunda "yaklaşık 30 büyükbaş ve 50 koyun kapasiteli küçük ölçekli mezbaha projesi" ifadesi geçiyor.

### E) `/tr/mezbaha-sistemleri-videolar-941/` — Video galerisi
Sayfa başlığı dışında görünür metin yok (video player gömülü, muhtemelen JS ile yükleniyor — sayfa kaynağında video linkleri ayrıca kontrol edilmeli).

### F) `/tr/satis-agi/` ve `/tr/temsilcilikler/` — Satış ağı / bayilik
- `/tr/satis-agi/`: Ülke listesi (metin, link yok): Almanya, Belçika, Rusya, Türkmenistan, Kazakistan, Arabistan, Makedonya, Azerbaycan, Gürcistan, Tunus, Fas.
- `/tr/temsilcilikler/`: En az 1 kayıtlı temsilci — Azferma MMC (Azerbaycan), tel/gsm/e-posta ile. (Sayfa scroll ile daha fazla temsilci içerebilir, tam liste teyit edilmedi.)
- Ayrıca `/tr/iletisim/` sayfasında "Satış Danışmanlarımız" bölümünde 2 kişi listeleniyor: IFarming LLC – Artem Eliseev (Rusya, ifarming.ru) ve Sultan Suerkulov (Kırgızistan).

---

## 5. Blog Yazıları

Blog listesi: `/tr/blog/`. Tüm yazı URL'leri **düz** `/tr/[slug]/` yapısında (blog önekiyle değil), sitemap'te de bu şekilde yer alıyor. Breadcrumb her yazıda "Blog - Mezbaha Sistemleri" olarak görünüyor, dolayısıyla yazının blog kategorisine ait olduğu teyit edildi.

**Toplam tespit edilen blog yazısı: 32** (sitemap-tr.xml'de listelenen, kategori/ürün sayfası olmayan tüm URL'ler). URL deseni: `/tr/[konu-anlatan-slug]/` — SEO odaklı, soru biçiminde veya "nasıl/nedir/ne kadar sürer" kalıplı başlıklar hâkim.

Örnek başlıklar (tam liste sitemap'te mevcut, tekrar etmeyecek şekilde konu grupları):
- Ürün/ekipman odaklı: "Raylı Taşıma Sistemleri (İkizray) Nedir ve Neden Kullanılır?", "Otomatik Deri Yüzme Sistemleri ile İşçilik Maliyeti Nasıl Azalır?", "Karkas Taşıma Sistemleri Et Kalitesini Nasıl Etkiler?", "Et Parçalama Testereleri: Hızlı ve Güvenli Kesim Ekipmanları", "Döş Açma Testeresi ile Hızlı ve Hijyenik Kesim İçin İpuçları", "Hidrolik Deri Yüzme Makinası mı Mekanik Deri Yüzme mi?", "Ayak Kesme Makası ile Manuel Kesim Hatalarını Azaltmanın Yolları", "Robotik Mezbaha Sistemleri Nedir?", "İşkembe Atık Pompası ile Atık Yönetimi", "Büyükbaş Sersemletme Sistemleri 2025 Rehberi"
- İş kurma/mevzuat odaklı: "Devlet Teşvikleriyle Mezbaha Kurmak: Güncel Hibe Rehberi", "Mezbaha Kurmak Ne Kadar Sürer? Adım Adım Süreç", "Mezbaha Kurulumunda Hangi Belgeler Gereklidir?", "Mezbaha Kurulum Maliyeti", "Küçükbaş Büyükbaş Mezbaha Farkı"
- Verim/kalite odaklı: "Mezbaha Kullanmaya Geçmenin Finansal Avantajları", "Et Kalitesini Artıran Mezbaha Uygulamaları", "Mezbaha Otomasyonu ile Verimlilik Artışı", "Kesimhanelerde Enerji Tasarrufu Sağlama"
- Refah/hijyen odaklı: "Kesim Öncesi Hayvan Stresini Azaltmanın Bilimsel Yolları", "Mezbaha Tasarımında Hayvan Refahı Nasıl Korunur?", "Mezbaha Hijyeni Nasıl Sağlanır?"
- SSS tipi kısa yazılar: "Sığır Kesiminde En Sık Kullanılan Makineler Nelerdir?", "Modern Makinelerle Bir Hayvanın İşlenmesi Ne Kadar Sürer?", "Mezbaha Makineleri Et Kalitesini Etkiler mi?", "Küçük Çiftlikler Mezbaha Makineleri Kullanabilir mi?", "Mezbahalarda Kullanılan Makineler Güvenli mi?"
- Diğer: "Online Mağazamız Yayında" (duyuru yazısı, rehber değil — bu firmanın bir e-ticaret/online mağaza girişimi olduğuna işaret ediyor, ayrıca doğrulanmadı)

Yazılarda görünen tarihler yıl belirtmiyor (ör. "25 March", "08 January", "11 September") — gerçek yayın yılları teyit edilemedi.

Blog içerik kalitesi: Örneklenen yazı ("Raylı Taşıma Sistemleri...") SEO odaklı, başlık-alt başlık yapılı, ~500-800 kelimelik makale formatında. Ürün sayfalarına dönük satış içeriğinden çok bilgilendirici/eğitici ton kullanıyor.

---

## 6. Kurumsal Sayfalar

### `/tr/kurumsal/` (Hakkımızda)
İçerik, ana sayfadaki "Kurumsal" bölümüyle **birebir aynı metin** (kopyalanmış/tekrarlanan boilerplate). Gerçek içerik:
> "Proje uzmanlarımız müşteriye özel Mezbaha ve Et İşleme Sistemleri Tasarımı ve İmalat, geliştirilmesi konusunda çalışmaktadır. Türkiye çapında uzman ekibimiz tarafından kurulmuş ve hizmete alınmış tesisler müşteri memnuniyetini göstermektedir... Mezbaha Teknolojileri Deneyimi büyük ve küçük et işleme şirketlerin özel, ulusal, bölgesel ve yerel gereksinimlerini karşılamak için makine ve ekipman sağlar. Otomasyon düzeyinde Anahtar teslimi çözümler sunmayı sağlıyoruz."
> "Türkiye çapında liderlik — Mezbaha Teknolojileri Mezbaha otomasyon sistemleri konusunda liderdir."

**Doğrulanamayan/bulunmayan içerikler** (yeni sitede uydurulmamalı): kuruluş yılı, şirket tarihçesi, ekip/yönetici isimleri-fotoğrafları, sertifikalar (ISO, CE vb. hiçbir sertifika rozeti/sayfası bulunamadı), misyon-vizyon ayrı bölümü, üretim tesisi/fabrika fotoğrafları galerisi. Bunların hiçbiri sitede tespit edilmedi — "liderlik" iddiası somut veriyle desteklenmiyor (pazar payı, müşteri sayısı gibi rakamlar yok).

### Sertifikalar
Sitede ayrı bir "Sertifikalar" sayfası veya bölümü **tespit edilmedi**. Yeni sitede bu bölüm eklenecekse, gerçek sertifika bilgisi müşteriden teyit alınmadan üretilmemelidir.

---

## 7. İletişim Sayfası

URL: `/tr/iletisim/` (sitemap'te yok, ama nav'da ve gerçek sayfada mevcut).

**Adres (Fabrika):**
S.S İstanbul Mermerciler Sanayi Sitesi, 22. Sokak No: 15, Köseler Mahallesi, Dilovası / Kocaeli

**Telefonlar:**
- Tel: +90 262 502 18 94
- Proje / Project Sales: +90 541 785 17 25
- Proje / Project: +90 530 242 86 84
- Muhasebe / Accounting: +90 539 552 81 66
- WhatsApp Müşteri Temsilcisi: +90 505 500 24 96

**E-posta:**
- bilgi@mezbahateknolojileri.com
- muhasebe@mezbahateknolojileri.com

**Satış Danışmanlarımız (uluslararası):**
- IFarming LLC — Artem Eliseev (Rusya), Mob: +7 903 707 15 71, ifarming.ru, info@ifarming.ru
- Sultan Suerkulov (Kırgızistan), Gsm: +90 538 545 74 71

**İletişim formu alanları:**
- *Adınız, Soyadınız (zorunlu)
- *E-posta Adresiniz (zorunlu)
- Telefon Numaranız (opsiyonel)
- "Nasıl yardımcı olabiliriz?" dropdown: Servis Talebi / Proje Talebi / Fiyat Talebi
- *Konu (zorunlu)
- *İletmek İstedikleriniz (mesaj, zorunlu)
- Butonlar: GÖNDER / Vazgeç

Form gönderimi test edilmedi (talimat gereği hiçbir form gönderilmedi).

---

## 8. Diğer Sayfa Tipleri

- **Kataloglar** (`/tr/kataloglar/`): Tek katalog listesi — "2018 Mezbaha Sistemleri Katalog". Detay sayfası: `/tr/mezbaha-makina-sistemleri-katalog/` — gömülü 155 sayfalık PDF flipbook görüntüleyici ("1/155" sayaç görüldü). **Katalog 2018 tarihli, güncel olmayabilir** — yeni sitede güncellenmiş bir katalog gerekebilir.
- **Proje Resimleri** (`/tr/proje-resimleri/`): 3D proje görselleri / fotoğraf galerisi.
- **Videolar** (`/tr/mezbaha-sistemleri-videolar-941/`): Video galerisi sayfası, ayrıca ana sayfada "Mezbaha Makineleri Videoları" bölümü var.
- **Temsilcilikler** (`/tr/temsilcilikler/`): Bayi/distribütör listesi.
- **Satış Ağı** (`/tr/satis-agi/`): Hedef ülkeler listesi.
- **Kariyer sayfası**: Tespit edilmedi — sitede "Kariyer", "İş İlanları" veya benzeri bir bölüm bulunamadı.
- **"Online Mağazamız Yayında" blog yazısı**: Bir e-ticaret/online satış girişimine işaret ediyor ama site içinde ayrı bir mağaza/e-ticaret alanı bulunamadı — sadece bu duyuru yazısı var; iddia doğrulanamadı.

---

## 9. URL Yapısı / Deseni Gözlemleri

- Dil öneki: `/tr/`, `/en/` (ayrıca kök `/` da EN içerik gösteriyor — canonical `https://www.mezbahateknolojileri.com/` EN sayfaya işaret ediyor), `/ru/`, `/de/`, `/ar/`, `/fa/` (bkz. Bölüm 10).
- **Düz (flat) slug yapısı hakim**: Kategoriler, ürünler ve blog yazılarının hepsi `/tr/[slug]/` altında, aralarında `/urun/`, `/blog/`, `/proje/` gibi ayırt edici bir URL segmenti YOK (yalnızca `/tr/blog/` listeleme sayfası var, tekil yazılar flat).
- Bazı slug'larda otomatik/anlamsız sayısal son ekler var (muhtemelen CMS slug çakışması çözümü): `mekanik-deri-yuzme-673`, `ceyrekleme-elevatoru-872`, `pnomatik-iskembe-platformu-707`, `kanama-vinci-876`, `ciger-konveyoru-308`, `projeler-553`, `mezbaha-sistemleri-videolar-941`.
- En az bir üründe **İngilizce slug Türkçe sayfa altında** kullanılmış: `/tr/sheep-bleeding-elevator/` (olması gereken: koyun-kanama-elevatoru gibi bir TR slug).
- Kategori sayfası URL'leri de ürünlerle aynı düz yapıda: `/tr/buyukbas-mezbaha-makinalari/`, `/tr/kucukbas-mezbaha-makinalari/`, `/tr/kurban-kesim/`, `/tr/mezbaha-sistemleri/`.
- Trailing slash tutarlı şekilde tüm URL'lerde kullanılıyor.

---

## 10. Diğer Diller / Lokaller

`hreflang` etiketlerinden (ana sayfa `<head>` kontrolü) tespit edilen 6 dil:
- `tr` → `/tr/` (varsayılan/kaynak içerik)
- `en` → `/` (kök domain, önek yok — dikkat: EN içerik kökte, TR içerik `/tr/` altında)
- `ru` → `/ru/`
- `de` → `/de/`
- `ar` → `/ar/`
- `fa` → `/fa/` (Farsça)

Sadece **tr, en, ru** için ayrı XML sitemap dosyası var (`sitemap-tr.xml`, `sitemap-en.xml`, `sitemap-ru.xml`) — de/ar/fa sitemap'te değil, muhtemelen daha az sayfası olan veya eksik/yarı çevrilmiş diller.

`/de/`, `/ar/`, `/fa/` sayfaları ziyaret edildiğinde **başlık ve ana metin çevrilmiş** ancak **navigasyon menüsü hâlâ Türkçe** görünüyor (ör. "KURUMSAL", "MEZBAHA SİSTEMLERİ ÜRÜNLER", "PROJELER", "FİYAT LİSTESİ", "REFERANSLAR", "KATALOGLAR", "İLETİŞİM") — bu bir **çeviri eksikliği / QA sorunu** olarak not edildi, yeni sitede tekrarlanmamalı. Ayrıca bu dillerde nav'da "FİYAT LİSTESİ" (Fiyat Listesi) diye bir öğe var ki TR/EN nav'da yok — muhtemelen eksik/yarım bir özellik.

EN sitemap ve RU sitemap içerikleri ayrıca satır satır incelenmedi (kapsam TR odaklı tutuldu, talimat gereği); gerekirse ayrı bir görev olarak EN/RU içerik paritesi kontrol edilebilir.

---

## 11. Görsel / Medya Kalıpları

- **Hero/ana sayfa**: Metin ağırlıklı, büyük hero görseli read_page ile doğrulanmadı (get_page_text görsel içermiyor) — ekran görüntüsü alınmadı, bu nedenle hero görselinin varlığı/stili görsel olarak teyit edilmedi.
- **Ürün sayfaları**: Her üründe bir "Resimleri" galerisi var, resim başlıkları açıklayıcı (ör. "Hidrolik Deri Yüzme Makinası – Ön Görünüm", "Üretim Hattına Entegre Hidrolik Deri Yüzme Makinası") — gerçek ürün fotoğrafları (stok/jenerik görsel değil, kurulum fotoğrafları gibi görünüyor).
- **Proje sayfaları**: Video + iç/dış görünüş fotoğrafları + makina yerleşim planı (teknik çizim) kombinasyonu — her kapasite paketi (C-50, C-100 vb.) için ayrı video ve görsel seti var.
- **Video içeriği**: Ana sayfada "Mezbaha Makineleri Videoları" bölümü ve ayrı bir `/tr/mezbaha-sistemleri-videolar-941/` video galerisi sayfası var. Video barındırma platformu (YouTube gömme mi, kendi sunucusu mu) teyit edilmedi.
- **Ayrı bir görsel sitemap dosyası var**: `sitemap-images.xml` — bu, sitenin SEO için görsel sitemap'i aktif kullandığını gösteriyor (görsel arama optimizasyonuna önem verilmiş).
- **PDF katalog**: 155 sayfalık gömülü flipbook görüntüleyici (`/tr/mezbaha-makina-sistemleri-katalog/`).

---

## 12. Meta Etiketler / Yapısal Veri Örnekleri

Ana sayfa (`/` = EN varsayılan) `<head>` içinden alınan gerçek değerler:
```
title: "Slaughterhouse Systems & Equipment - Slaughterhouse Technologies"
meta description: "High-performance slaughtering systems designed for meat processing plants. Reliable, hygienic and built for industrial use."
canonical: https://www.mezbahateknolojileri.com/
og:title: "Slaughterhouse Systems & Equipment"
og:image: https://www.mezbahateknolojileri.com/templates/images/og-img.png
robots: index, follow
```
TR ana sayfa title: "Mezbaha - Mezbaha Teknolojileri" (SEO açısından zayıf — anahtar kelime/benefit içermiyor, sadece marka adı).
İletişim sayfası title: "Bize Ulaşın | Mezbaha Sistemleri - Mezbaha Teknolojileri".
Kurumsal sayfa title: "Kurumsal Kimliğimiz - Mezbaha Teknolojileri".
Kurban Kesim kategori title: "Kurban Kesim Ekipmanları & Sistemleri - Mezbaha Teknolojileri" (SEO açısından en güçlü örnek — anahtar kelime + fayda içeriyor).

JSON-LD / Schema.org yapılandırılmış veri kontrolü kapsamlı yapılmadı (yalnızca meta/og/hreflang/robots/canonical kontrol edildi); yeni SEO+GEO çalışmasında ayrıca `view-source` üzerinden Schema.org (Organization, Product, LocalBusiness, Article vb.) varlığı teyit edilmeli — bu envanterde bu konuda kesin bir "var/yok" iddiası yapılmıyor.

---

## 13. Genel Gözlemler / Yeni Site için Notlar

1. **İçerik tekrarı**: Ana sayfa "Kurumsal" bölümü ile `/tr/kurumsal/` sayfası birebir aynı metni taşıyor — orijinal, ayrıştırılmış "Hakkımızda" içeriği yok.
2. **Kategori/ürün ayrımı zayıf**: "Büyükbaş" kategorisi neredeyse tüm ürün kataloğunu tek sayfada listeliyor; yeni sitede daha net bir bilgi mimarisi kurulmalı.
3. **Teknik spesifikasyon eksikliği**: Çoğu ürün sayfasında somut sayısal veri (kapasite, güç, ölçüler, malzeme kalınlığı vb.) yok — sadece pazarlama metni var. Yeni site için bu, müşteriden ek teknik veri toplanması gereken bir alan.
5. **URL tutarsızlıkları**: Sayısal son ekli slug'lar, bir üründe İngilizce slug kullanımı, sitemap ile canlı nav arasındaki uyumsuzluk (`/tr/projeler-553/` vs `/tr/projeler/`) — migration map'te bunların hepsi 301 ile düzeltilmeli.
6. **Çok dilli site ama eksik çeviri**: DE/AR/FA sayfalarında nav menüsü çevrilmemiş.
7. **Eski katalog**: PDF katalog 2018 tarihli.
8. **Sertifika/kariyer/ekip sayfası yok**: Bu bölümler için yeni sitede içerik üretilecekse gerçek veri müşteriden istenmeli, örnek/uydurma içerik konulmamalı.
9. **Referans verisi iki farklı formatta**: (a) ana sayfadaki uluslararası kart listesi (ülke/kapasite/tip ile zengin), (b) `/tr/referanslar/` sayfasındaki düz metin müşteri isim listesi (Türkiye ağırlıklı, çok sayıda belediye). Yeni sitede bu ikisi birleştirilip tek, tutarlı bir "Projeler/Referanslar" veri modeline taşınmalı.
