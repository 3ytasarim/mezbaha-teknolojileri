# S1-01 — Geri Alma (Rollback) Planı

> **Durum:** Hazırlık. Hiçbir canlı değişiklik yapılmadı. Bu plan yalnızca, onaylı uygulama sonrası sorun çıkarsa kullanılır.
> İlgili: [`USA_SEO_S1_01_PREFLIGHT.md`](USA_SEO_S1_01_PREFLIGHT.md) · [`USA_SEO_S1_01_TEST_PLAN.md`](USA_SEO_S1_01_TEST_PLAN.md) · [`USA_SEO_S1_01_REDIRECT_CHANGES.csv`](USA_SEO_S1_01_REDIRECT_CHANGES.csv)

## 1. Ne geri alınır?

Yalnız CSV'deki `action != NO_CHANGE` satırları (204): her satırın **`destinationPath` ve `active`** alanları. Başka alan/satır/tablo etkilenmez. Faz A (7 satır) ve Faz B (197 satır) ayrı ayrı veya birlikte geri alınabilir.

Orijinal durum (geri alınacak değerler) uygulamadan hemen önce alınan **tam tablo yedeğinden** okunur; CSV'deki `current_target` / `current_active` sütunları ikinci bir kayıttır.

## 2. Yedekleme yöntemi (uygulama betiği otomatik yapar)

`node prisma/migration/s1-01-redirect-recovery.cjs --phase A --apply --confirm=S1-01-APPROVED` çalıştığında, **veritabanına yazmadan önce** şu dizin oluşturulur: `../_backups/redirect-s1-01-<ISO-zaman>/` (`S1_01_BACKUP_DIR` ile değiştirilebilir). İçerik:

| Dosya | Amaç |
|---|---|
| `redirect-table-full.json` | `Redirect` tablosunun **tamamı** (553 satır; `createdAt`/`updatedAt` dahil) |
| `restore.sql` | 204 satır için `UPDATE … SET destinationPath, active, updatedAt = <orijinal> WHERE id = … AND destinationPath = <yeni değer>;` — tek `BEGIN/COMMIT` içinde, **orijinal `updatedAt` korunur** |
| `backup.sha256` | `redirect-table-full.json` içeriğinin (kompakt JSON) SHA-256'sı — bütünlük kontrolü |

Her faz için ayrı yedek dizini oluşur (Faz B de kendi yedeğini alır). **Dizini silmeyin; bütünlüğünü `backup.sha256` ile doğrulayın.** Yedek dosyaları sır içermez (yalnız yol eşlemeleri), yine de repoya eklenmemelidir (`../_backups` repo dışıdır).

Ek güvenlik: Neon (PITR/branch) tarafında uygulamadan hemen önce bir branch/snapshot alınması önerilir (isteğe bağlı, ayrı onay; bu sprintte yapılmadı).

## 3. Geri alma yöntemleri

### 3.1 Önerilen: korumalı geri alma betiği (`prisma/migration/s1-01-redirect-rollback.cjs`)

```bash
# 1) dry-run (varsayılan, yazmaz): ne geri alınacağını ve çakışmaları gösterir
node prisma/migration/s1-01-redirect-rollback.cjs --backup ../_backups/redirect-s1-01-<zaman>

# 2) uygula (yalnız onayla)
node prisma/migration/s1-01-redirect-rollback.cjs --backup ../_backups/redirect-s1-01-<zaman> --apply --confirm=S1-01-ROLLBACK
```

Davranış:
- Yedeğin SHA-256'sı `backup.sha256` ile karşılaştırılır; uyuşmazlıkta raporlar.
- Her satır için: canlı değer **orijinal** ise "zaten orijinal" (atlanır, **idempotent**); canlı değer **bu migration'ın yazdığı değer** ise geri alınır; ikisi de değilse (sonradan başkası değiştirmiş) **çakışma** sayılır ve **dokunulmaz** (`--skip-conflicts` ile yalnız çakışmayanlar geri alınır).
- Tek transaction + `pg_try_advisory_xact_lock`; her `updateMany` `id + mevcut yeni değer` ile eşleşir, tam 1 satır etkilemezse transaction iptal.
- Not: Prisma `updatedAt`'i günceller; orijinal zaman damgası gerekiyorsa §3.2'yi kullanın.

### 3.2 Alternatif: `restore.sql` (orijinal `updatedAt` ile)

```bash
psql "$DATABASE_URL_DIRECT" -v ON_ERROR_STOP=1 -f ../_backups/redirect-s1-01-<zaman>/restore.sql
```
Doğrudan (pooler olmayan) bağlantı kullanın (çok komutlu işlem + commit pooler'da kaybolabilir). Koşul `AND destinationPath = <yeni değer>` olduğundan sonradan değişmiş satırlar ezilmez.

### 3.3 Acil durum (tek satır)

Belirli tek bir URL sorunluysa betik gerekmez: yönetim arayüzünden o satırın `destinationPath`/`active` alanı yedekteki değere çevrilir (60 sn içinde yürürlüğe girer).

## 4. Faz bazında geri alma

| Durum | Eylem | Sonuç |
|---|---|---|
| Faz A sonrası G1/G2 başarısız (Faz B henüz uygulanmadı) | **Faz A yedeğiyle** geri al | 7 satır orijinal (bilinen bozuk) haline döner; yeni deploy gerektirmez |
| Faz B sonrası bazı `Location` yanlış | Yalnız **Faz B yedeğiyle** geri al | Faz B yedeği Faz A uygulanmış tabloyu içerir → betik yalnız 197 B satırını geri alır, A satırlarını "zaten orijinal" sayıp atlar; 7 canonical doğru kalır |
| Tam geri dönüş (A + B) | **Faz A yedeğiyle** (tek geçiş) | Faz A yedeği tüm tabloyu orijinal haliyle içerir; betik 204 satırın tümünü tek transaction'da geri alır. Tablo parmak izi orijinale (`03b484d9…e5e706`) eşit olmalı |

> Kural: yedeğin kapsadığı en geniş geri alma = o yedeğin alındığı andan önceki durum. Faz A yedeği → tam geri dönüş; Faz B yedeği → yalnız B. Tek transaction olduğundan 19 bağımlı satır arasında ara durum oluşmaz.

## 5. Geri alma sonrası doğrulama

1. ≥70 sn bekleyin (proxy önbelleği 60 sn).
2. `node prisma/migration/s1-01-verify.cjs --expect current` → hepsi geçmeli (anlık görüntü = orijinal durum).
3. Tablo parmak izi: geri alma betiği/SQL sonrası `fingerprint(rows)` = `03b484d9dc1c907ed5f9c5c5926828adc31dce030f0cdc86f3588ebb09e5e706` (tam geri dönüşte).
4. Sunucu logunda 5xx artışı yok.

## 6. Geri alma provası (bu sprintte, salt-okunur)

Canlı tablo yedek gibi okunup (`SELECT`) geçici dizine yazıldı; üç senaryo koşuldu, **yazma yok**:

| Senaryo | Sonuç |
|---|---|
| Canlı = orijinal (uygulama öncesi) | `alreadyOriginal: 204`, `wouldRestore: 0`, çakışma 0, `backupSha256Matches: true` |
| `--simulate-applied` (204 satır uygulanmış varsayımı, bellekte) | `wouldRestore: 204`, çakışma 0; geri alma sonrası **parmak izi orijinal yedekle eşit** (`fingerprintAfterRestoreEqualsOriginalBackup: true`) |
| Idempotency | İkinci geri alma "zaten orijinal" |

## 7. Riskler ve notlar

- Geri alma, **bilinen bozuk durumu** (7 URL redirect döngüsü, 197 canonical'sız hedef) geri getirir; yalnız yeni durum daha kötüyse tercih edilmeli. Kısmi sorunlarda tek satır düzeltmesi (§3.3) çoğu zaman daha doğrudur.
- Redirect önbelleği süreç belleğindedir (60 sn TTL); PM2 yeniden başlatma gerekmez.
- Geri alma da canlı DB yazmasıdır → kullanıcı onayı gerekir (acil durumda kullanıcıya bildirimle).

## Betik konumları

- Uygulama: `prisma/migration/s1-01-redirect-recovery.cjs` · Geri alma: `prisma/migration/s1-01-redirect-rollback.cjs` · Doğrulama: `prisma/migration/s1-01-verify.cjs` (repoda, commit edilmemiş çalışma ağacında).
- Geri alma provası bu sprintte repodaki betikle yeniden koşuldu: `wouldRestore: 204`, çakışma 0, `fingerprintAfterRestoreEqualsOriginalBackup: true`.
