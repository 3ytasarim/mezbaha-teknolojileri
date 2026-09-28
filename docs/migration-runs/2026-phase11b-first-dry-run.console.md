# Phase 11B first dry-run — console output (archived in Phase 11C)

Reconstructed source: raw console log saved during the pre-import dry-run. The full markdown report (docs/migration-dry-run.md) was later overwritten by re-runs; this is the surviving record.

```

> mezbaha-teknolojileri@0.1.0 migrate:content
> tsx prisma/migrate-content.ts --dry-run

◇ injected env (13) from .env
Migration (DRY RUN — DB'ye YAZILMAYACAK) başlıyor...

0. Bilinen test-slug uzlaştırması...


   ProductCategory "kucukbas-mezbaha-makinalari" -> "kucukbas" olarak yeniden adlandırılacak (Phase 9-11A test verisi, url-migration-map.md kanonik slug'ıyla hizalanıyor).
   Project "azerbaycan-gobustan-kesimhane" -> "azerbaycan-gobustan" olarak yeniden adlandırılacak (Phase 9-11A test verisi, ülke-şehir slug şemasıyla hizalanıyor).
1. Redirect'ler (url-migration-map.md)...
   Yeni: 96, Güncellendi: 0, Çakışma: 0
2. Ürün kategorileri...
   Yeni: 3, Güncellendi: 0, Atlandı: 1
3. Projeler (referans + kapasite paketleri)...
   Yeni: 24, Güncellendi: 1, Atlandı: 1
4. Ürünler...
   Yeni: 51, Güncellendi: 4, Atlandı: 0, Hata: 0
5. Blog yazıları...
   Yeni: 29, Güncellendi: 3, Atlandı: 0, Hata: 0

Medya: indirilen/oluşturulan 317, yeniden kullanılan 0, başarısız 0

Rapor yazıldı: docs\migration-dry-run.md
```
