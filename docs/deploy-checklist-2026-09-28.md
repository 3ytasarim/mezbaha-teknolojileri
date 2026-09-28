# Sunucu güncelleme kontrol listesi (2026-09-28 değişiklikleri)

Bu, `git log` başındaki iki commit'i (kurumsal site + S3 kova taşıması + bugünkü OG düzeltmesi)
sunucuya almak için gereken adımlar. Sırayla uygulayın.

## 1. Kod

```bash
cd /srv/mezbaha/current   # gerçek release dizininizle değiştirin
git pull origin main
npm ci
```

## 2. Ortam değişkenleri — `.env.production` (sunucuda, chmod 600)

Aşağıdaki satırları **yerel** `.env.production` dosyanızdaki gerçek değerlerle ekleyin/güncelleyin
(hepsi zaten yerelde doğrulanmış durumda):

```
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=https://fsn1.your-objectstorage.com
STORAGE_REGION=fsn1
STORAGE_BUCKET=mezbahateknolojileri
STORAGE_ACCESS_KEY=<yerel .env.production'daki değer>
STORAGE_SECRET_KEY=<yerel .env.production'daki değer>
```

**Bu adım atlanırsa** admin panelden yeni görsel yükleme çalışmaz ve `STORAGE_ENDPOINT tanımlı
değil` hatası alınır.

## 3. Build

```bash
npm run build
```

## 4. nginx (önemli — `/uploads` artık diskten değil kovadan sunuluyor)

`deploy/nginx/mezbahateknolojileri.com.conf` içeriğini sunucudaki nginx site dosyasına kopyalayın
(özellikle `/uploads/` bloğu artık `alias` değil `proxy_pass` kullanıyor), sonra:

```bash
nginx -t && systemctl reload nginx
```

**Bu adım atlanırsa** yeni yüklenen görseller (kovada olsa da) sitede 404 verebilir, çünkü nginx
eski `/srv/mezbaha/shared/uploads/` diskini aramaya devam eder.

## 5. Uygulamayı yeniden başlat

```bash
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save
```

## 6. Doğrulama

```bash
curl -sI https://www.mezbahateknolojileri.com/images/og/mezbaha-teknolojileri-og.jpg
# 200 + content-type: image/jpeg beklenir

curl -s https://www.mezbahateknolojileri.com/ | grep 'og:image'
# .../images/og/mezbaha-teknolojileri-og.jpg görünmeli (eski hero görseli değil)
```

## Not: eski yerel görsel klasörü

`public/uploads` ve `public/images` altındaki raster dosyalar artık kullanılmıyor (kovaya taşındı).
Sunucuda `/srv/mezbaha/shared/uploads` altında eski dosyalar duruyorsa, 4. adım doğrulandıktan
sonra silinebilir — ama acele etmeyin, önce doğrulamayı tamamlayın.
