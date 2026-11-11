# Claude Code — 3 SEO makalesi x 6 dil (Mezbaha Teknolojileri)

Bu ZIP içeriğini mevcut **mezbahateknolojileri** repo'sundaki çalışan blog içerik modeli ve admin/import akışına entegre et.

## Kesin kurallar
1. `images/` altındaki **kullanıcının orijinal 3 JPEG dosyasını kesinlikle düzenleme, yeniden oluşturma, sıkıştırma, kırpma, watermark kaldırma, yapay zeka ile değiştirme veya farklı fotoğrafla ikame etme**. Görseller zaten SEO dostu dosya adlarına byte-byte değişmeden kopyalandı. `metadata/original-images-checksum.json` SHA-256 değerlerini yeniden doğrula.
2. **3 ayrı blog yazısı** yayınlama için hazırla, her birinde **EN, TR, DE, FR, RU, AR** versiyonları olsun. EN ana dil; ABD pazarı SEO öncelikli. Her yazı **kendi** fotoğrafını hero/kapak olarak kullansın; başka fotoğraf kullanma. Görsel `alt` ve açıklamaları `metadata/posts.json` dosyasında.
3. `articles/<lang>/` içinde UTF-8 Markdown tam içerikler bulunuyor. Başlıkları, H2/H3 semantiğini, SSS bölümlerini, gerçek kaynak bağlantılarını ve CTA'ları koru.
4. `metadata/posts.json`: meta title, meta description, excerpt, kategori/etiketler, resim alt/caption, yazar, slug ve hreflang önerilerini kullan. **Mevcut DB modeli ve admin şemasıyla eşleştir; sistemi bozacak kör SQL/schema değişikliği yapma.** Bloglar daha önce varsa idempotent upsert, aksi halde oluştur; hiçbir blogu silme.
5. Site URL desenlerini mevcut kodda kontrol et. `/blog/<slug>` ve `/<lang>/blog/<slug>` URL'leri pakette öneridir; gerçek route farklıysa uygulamanın mevcut yapısını izle. Her dil için self-canonical ve dönüşlü `hreflang` oluştur, `x-default` EN olsun. Diller: `en-US`, `tr-TR`, `de-DE`, `fr-FR`, `ru-RU`, `ar`. Arapça sayfada `dir=rtl`.
6. Fotoğrafları gerçek erişilebilir URL'lere upload et; responsive orijinal JPEG kullan. İlgili sayfada hero `<img>` öğesi, `width=1280` `height=1280`, kendi `alt` metni ve uygun lazy/eager stratejisi olsun. Resimleri CSS background olarak saklama. `og:image`, Twitter ve BlogPosting JSON-LD `image` alanı bu **gerçek fotoğraf URL'lerine** işaret etsin. Sahte/placeholder URL'leri canlıya alma.
7. `BlogPosting` schema kullan; gerçek yayın tarihi (`datePublished`) ve gerçek güncelleme tarihi (`dateModified`) yayın sırasında doldurulsun. Sahte tarih ekleme. SSS metnini HTML'de göster; sırf SEO için gereksiz FAQPage zengin sonuç vaadi verme.
8. Ürün sayfası bağlantısı: https://www.mezbahateknolojileri.com/product/sheep-processing-conveyor. 3. makaledeki yeşil bant ile bu üst taşıma ürünü aynı cihazmış gibi anlatma.
9. Geliştirmeden önce mevcut kodu, dil URL yapılarını, blog şemasını, medyayı, slug çakışmalarını ve önceki içerikleri incele. İşlemi **önce dry-run** olarak çalıştır; duplicate slug kontrolü, görsel eşleşmesi, alt, metadata, canonical, hreflang ve JSON-LD doğrula. Sonrasında sadece gereken içerikleri import et. Başka site içeriğine dokunma.
10. Kullanıcı onayı olmadan production deploy/restart yapma. Sonunda eklenen/değişen 18 dil sayfasının URL listesi, hangi görseli kullandıkları, DB kayıt sayıları, geçerli meta alanları ve hataları raporla.

## Kaynak klasörler
- `articles/` : 18 tam makale
- `images/` : fotoğraflar değiştirilmemiş kopya
- `metadata/posts.json` : tüm dil/SEO alanları
- `metadata/original-images-checksum.json` : görsel doğrulama
- `seo/` : önerilen hreflang, BlogPosting şeması, keyword planı

**Kalite kriteri:** 3 birbirinden ayrışmış yazı, doğru 3 orijinal fotoğraf, eksiksiz 6 dil, US-first SEO, siteyle uyumlu ve güvenli import.
