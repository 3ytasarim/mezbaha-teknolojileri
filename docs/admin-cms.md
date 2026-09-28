# Admin CMS

## Şu an hazır olan (Foundation, Phase 0-6)

- **Authentication:** `/admin/login` — email + parola (Argon2id doğrulama), DB tabanlı
  session (httpOnly cookie, 7 gün TTL).
- **Route protection:** `src/proxy.ts` (cookie varlık kontrolü) + her admin sayfasında/layout'ta
  `requireAdmin()` (gerçek DB session doğrulaması + rol kontrolü). Detay: `docs/architecture.md`.
- **Roller:** `SUPERADMIN` > `ADMIN` > `EDITOR` (bkz. `src/lib/auth/guard.ts` — `ROLE_RANK`).
  `/admin/kullanicilar` şu an `SUPERADMIN` gerektiriyor.
- **Admin shell:** Sidebar navigasyon (`src/components/admin/nav-data.ts` — master prompt'taki
  bölüm 9 menü yapısının birebir karşılığı), mobilde hamburger menü, masaüstünde sabit sidebar.
- **Dashboard:** Gerçek DB sayılarını gösteriyor (ürün/proje/blog sayısı, yeni mesaj/teklif
  sayısı) — sahte veri yok.
- **Diğer tüm bölümler** (Ürünler, Projeler, Blog, Sayfalar, Medya, Talepler, SEO, Menü, Ayarlar,
  Kullanıcılar): sadece **placeholder sayfalar** — `requireAdmin()` ile korumalı, ama CRUD
  implementasyonu yok. Bunlar Phase 12 (CMS/media) ve ilgili içerik fazlarında inşa edilecek.

## Kasıtlı olarak yapılmayanlar

Master prompt'un "PHASE 0-6 foundation" talimatı gereği şu anda **inşa edilmedi**:

- Ürün/Proje/Blog/Sayfa CRUD formları (create/edit/delete/publish akışları)
- Medya kütüphanesi upload UI'ı (storage abstraction hazır, `src/lib/storage/`, ama admin UI'dan
  bağlanmadı)
- SEO yönetim ekranı (meta title/description düzenleme arayüzü)
- Redirect yönetim ekranı (Redirect tablosu var, admin UI yok)
- Menü/Site Ayarları/Kullanıcı yönetim ekranları

## Sonraki fazda dikkat edilmesi gerekenler

- Her destructive işlem (delete, unpublish) için confirmation UI gerekiyor (master prompt
  bölüm 10) — henüz hiçbir CRUD yazılmadığı için bu kural henüz uygulanmadı.
- Server-side authorization + Zod validation, mevcut `login` server action'ındaki patern takip
  edilerek her yeni server action'da tekrarlanmalı.
- Product editor (bölüm 11), Project editor (bölüm 12), Blog CMS (bölüm 13) — her biri ayrı,
  görece büyük iş paketleri; tek seferde değil, aşama aşama planlanmalı.
