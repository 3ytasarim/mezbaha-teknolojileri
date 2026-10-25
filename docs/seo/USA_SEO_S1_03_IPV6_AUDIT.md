# S1-03 — IPv6 Bağlantısı ve DNS Sağlığı Denetimi

> **Tarih:** 2026-10-25 · **Kapsam:** yalnız SALT OKUNUR denetim. DNS, Nginx, güvenlik duvarı, netplan, PM2, veritabanı, kod, commit/deploy, Search Console'a dokunulmadı.
> **Kısa sonuç:** Raporlanan "IPv6 sorunu" **gerçek bir sunucu/DNS sorunu değil; benim S1-02'deki bir okuma hatamdır.** `mezbahateknolojileri.com` ve `www` için **yayımlanmış AAAA kaydı yoktur.** `<yerel-DNS-çözümleyici-IPv6>`, alan adının IPv6 adresi değil, **bu makinenin yerel DNS çözümleyicisinin (yerel ISP, Türkiye) adresidir.** Düzeltilecek bir DNS/Nginx/firewall ayarı yok.

---

## 1. Hata nasıl oluştu (düzeltme)

S1-02'de şu komutu filtreleyerek (`grep Address|Name`) çalıştırdım:

```
nslookup -type=A    www.mezbahateknolojileri.com   → Server: …  Address: <yerel-DNS-çözümleyici-IPv6>   ← DNS SUNUCUSUNUN adresi
                                                    Name:    www.mezbahateknolojileri.com
                                                    Address: 62.238.99.154                    ← gerçek A kaydı
nslookup -type=AAAA www.mezbahateknolojileri.com   → Server: …  Address: <yerel-DNS-çözümleyici-IPv6>   ← yine DNS SUNUCUSUNUN adresi
                                                    Name:    www.mezbahateknolojileri.com     ← AAAA cevabı YOK
```

`nslookup` her çıktının başına "Server / Address" (sorgulanan DNS sunucusu) satırını yazar. Filtre bu satırı alan adının adresi gibi gösterdi. Tam (filtresiz) çıktı bunu doğruluyor: AAAA sorgusunda `Name:` satırının altında hiç adres yoktur. "IPv6 üzerinden 80/443 zaman aşımı" testlerim ise **web sunucusuna değil, yerel DNS çözümleyicisinin/ağ geçidinin adresine** bağlanmaya çalışıyordu; orada web sunucusu olmadığı için zaman aşımı doğaldı.

S1-02 raporundaki ilgili paragraf ve PREFLIGHT §15 buna göre **geçersizdir** (bkz. PREFLIGHT §16 düzeltme notu). Bu durum S1-01/S1-02'nin redirect ve blog düzeltmelerini etkilemez.

---

## 2. DNS denetimi (kanıtlı)

Kaynaklar: Google DoH, Cloudflare DoH, yetkili nameserver'lara doğrudan UDP sorgusu, yerel çözümleyici. (Quad9 DoH bu ağdan erişilemedi: port 5053; bu nedenle 2 genel çözümleyici + 2 yetkili NS + yerel çözümleyici karşılaştırıldı.)

| Kayıt | Apex `mezbahateknolojileri.com` | `www.mezbahateknolojileri.com` | Çözümleyiciler |
|---|---|---|---|
| **A** | `62.238.99.154` (TTL 1800) | `62.238.99.154` (TTL 1800) | Google = Cloudflare = yerel = **iki yetkili NS** (aynı) |
| **AAAA** | **YOK** (NOERROR/NODATA, SOA döner) | **YOK** | Google = Cloudflare = yerel = **iki yetkili NS** (hepsi boş) |
| **CNAME** | yok | yok | — |
| **NS** | `knuth.ihsdns.com` (94.138.196.9), `dijkstra.ihsdns.com` (167.172.166.241) | (apex'ten devralır) | Google = Cloudflare |
| **SOA** | `knuth.ihsdns.com` / `dnsadmin.ihs.com.tr`, serial `2026092600`, refresh 10800, retry 3600, expire 1209600, minimum 3600 | — | aynı |
| **MX** | `mx1.hostinger.com` (5), `mx2.hostinger.com` (10) | yok | aynı |
| **TXT** | `v=spf1 include:_spf.mail.hostinger.com ~all` | yok | aynı |
| **CAA** | yok | yok | — |
| **DNSSEC** | yok (DS/DNSKEY yok) | — | — |

Yorum:
- **DNS tutarlı:** sonuçlar tüm çözümleyicilerde ve yetkili sunucularda aynı; yayılım/tutarsızlık sorunu yok. TTL 1800 s (30 dk).
- **A kaydı aktif production sunucusunu gösteriyor:** `62.238.99.154` üzerinde TLS 1.3 + HTTP/2 çalışan ve sitemizi servis eden nginx/1.24.0 (Ubuntu) yanıt veriyor (S1-01/02 testleri bu adrese yapıldı; canlı site içeriği ve sertifika bu sunucuya ait).
- DNS barındırıcı: **IHS Telekom** (`ihsdns.com`, Türkiye); web sunucusu ise ayrı bir sağlayıcıda (aşağıda).

## 3. IP sahipliği (RIPE RDAP / RIPEstat)

| Adres | Sahip | Ayrıntı |
|---|---|---|
| **`62.238.99.154`** (IPv4) | **Hetzner Online GmbH** | Blok `62.238.96.0/20` "CLOUD-HEL1" (Hetzner Cloud, Helsinki, FI); `62.238.0.0/17`'de BGP'de **AS24940 (HETZNER-AS)** tarafından duyuruluyor; PTR `static.154.99.238.62.clients.your-server.de` |
| **`<yerel-DNS-çözümleyici-IPv6>`** ("IPv6") | **yerel internet sağlayıcısı (Türkiye)** — ISP'ye ait RIPE bloğu | BGP'de web barındırma duyurusu yok (RIPEstat: ASN/prefix boş sonuç); **bu makinenin yerel DNS çözümleyicisi** (ping 4 ms, `tracert -6` ilk hop'ları yerel ağ). Hetzner'e ait **değil**, siteyle ilgisi **yok** |

## 4. Sunucu IPv6 denetimi — **YAPILAMADI** (erişim yok)

İstenen sunucu içi kontroller (`ip -6 addr`, `ip -6 route`, `ss -ltnp`, firewall, nginx `listen [::]`) için sunucuya SSH erişimim yok (SSH anahtarıyla oturum açılamadı; başka kullanıcı/parola denemesi yapmadım). **Bu bölümü yapılmış gibi sunmuyorum.**

Bu denetim bu sorunun çözümü için **gerekli değil** (AAAA yok → hiçbir istemci IPv6 ile bağlanmaya yönlendirilmiyor). Yalnız ileride "sunucuda IPv6 var mı, açmaya değer mi?" sorusu için §7'deki salt-okunur komutlar kullanılabilir (kullanıcı SSH oturumunda, değişiklik yapmadan).

## 5. Dış ağ testleri

| Test | Sonuç |
|---|---|
| IPv4 HTTP — `http://www` ve `http://` apex | tek hop **301 → `https://www.mezbahateknolojileri.com/`** (path korunur) |
| IPv4 HTTPS — `https://www` | **200**; `https://` apex → tek hop **301 → www** |
| TLS | TLS 1.3, ALPN **h2**, `authorized=true`; CN/SAN: `mezbahateknolojileri.com` + `www.mezbahateknolojileri.com` (iki host adı için de geçerli, hostname uyumu doğru); yayıncı Let's Encrypt (YE2); **geçerlilik 2026-09-28 → 2026-12-27** |
| İlk HTTP yanıtı / redirect zinciri | S1-01/02 tam denetimleri: 363 redirect tek hop, sitemap 820/820 doğrudan 200 |
| **IPv6 HTTP/HTTPS** | **Test edilemez/anlamsız:** alan adının AAAA kaydı yok; bağlanılacak bir IPv6 uç noktası yayımlanmamış. Test makinesinin kendi IPv6 internet erişimi var (ipv6.google.com → 200), yani "IPv6 ortamı yok" durumu değil; hedefte IPv6 yok. Sunucunun gizli bir IPv6 adresi olabilir mi sorusu, adresi bilmeden test edilemez (tahmin edilmedi). |

## 6. Kök neden değerlendirmesi

| Olasılık | Karar | Kanıt |
|---|---|---|
| A. AAAA yanlış sunucuyu gösteriyor | **Geçersiz** | AAAA kaydı yok (2 genel çözümleyici + 2 yetkili NS + yerel). |
| B. IPv6 sunucuya atanmamış | **Bilinmiyor / alakasız** | SSH yok; ancak AAAA olmadığından etkisiz. |
| C. IPv6 routing/gateway hatalı | **Bilinmiyor / alakasız** | aynı |
| D. Firewall IPv6'yı engelliyor | **Bilinmiyor / alakasız** | aynı |
| E. Nginx IPv6'da dinlemiyor | **Bilinmiyor / alakasız** | aynı |
| F. Sağlayıcı IPv6'yı yönlendirmiyor | **Bilinmiyor / alakasız** | ISP bloğu Hetzner'e değil yerel ISP'a ait; Hetzner IPv6'sı için bir duyuru/adres yok |
| **G. Dış kaynaklı / ölçüm hatası** | **KESİN NEDEN** | `<yerel-DNS-çözümleyici-IPv6>`, `nslookup` çıktısındaki *Server* satırı = yerel DNS çözümleyicisi (yerel ISP). Zaman aşımları web sunucusuna değil bu adrese yapılmıştı. |

**Sonuç:** IPv6 bağlantısı "çalışmıyor" değil — **hiç yayımlanmamış.** Sitenin IPv4 erişimi tam sağlıklı.

---

## 7. Çözüm seçenekleri

### Seçenek 0 (ÖNERİLEN): Hiçbir şey değiştirme
- **Avantaj:** sıfır risk; site IPv4 ile mükemmel çalışıyor; tüm arama motorları ve tarayıcılar IPv4 ile erişebiliyor. IPv6 olmaması SEO sıralamasını doğrudan etkilemez (Googlebot IPv4 ile tarar; IPv6-only istemci oranı çok düşük).
- **Risk/kesinti:** yok. **Rollback:** gerekmez. **DNS yayılımı:** yok.
- **Uygulama sonrası test:** yok (değişiklik yok).

### Seçenek B — "Hatalı AAAA'yı kaldır"
- **Uygulanamaz:** kaldırılacak bir AAAA kaydı yok. Hiçbir DNS kaydı silinmemeli (özellikle MX/TXT/NS; Hostinger e-posta kayıtları çalışıyor).

### Seçenek A — IPv6'yı gerçekten açmak (isteğe bağlı, ileride)
Yalnız IPv6 erişimi hedefleniyorsa (zorunlu değil). Adımlar (hepsi ayrı onay gerektirir; bu sprintte uygulanmadı):

1. **Önce salt-okunur doğrulama (SSH, değişiklik yok):**
   ```bash
   ip -6 addr show scope global          # Hetzner Cloud sunucuya atanmış /64 var mı?
   ip -6 route show default
   curl -6 -s -o /dev/null -w '%{http_code}\n' https://ifconfig.co   # dışarı IPv6 çıkışı
   ss -ltnp | grep -E ':(80|443)\b'      # nginx [::]:80 / [::]:443 dinliyor mu? (0.0.0.0 yalnız IPv4)
   sudo nginx -T 2>/dev/null | grep -E 'listen\s+\[::\]'
   sudo ufw status verbose 2>/dev/null || sudo ip6tables -S   # 80/443 IPv6 izni
   ```
2. **Gerekli değişiklikler (yalnız doğrulama başarılıysa):** nginx `server` bloklarına `listen [::]:80;` ve `listen [::]:443 ssl;` (+`http2`) eklemek; firewall'da 80/443 için IPv6 kuralı; Hetzner firewall (Cloud paneli) IPv6 kuralı; **en son** DNS'e `www` ve apex için AAAA eklemek (sunucunun gerçek IPv6'sı, Hetzner'in verdiği adres).
3. **Önce yerel test:** `curl -6 --resolve www.mezbahateknolojileri.com:443:[<sunucu-ipv6>] https://www.mezbahateknolojileri.com/` — AAAA eklenmeden başarılı olmalı (200, doğru sertifika, redirect zinciri aynı).
4. **Avantaj:** IPv6-only/IPv6-öncelikli istemciler için erişim ve küçük hız kazancı. **Risk:** AAAA eklenir ama IPv6 hattı (nginx/firewall/Hetzner firewall) eksik kalırsa IPv6 istemcileri zaman aşımına uğrar ve Googlebot dahil bazı istemciler gecikme yaşar; Let's Encrypt HTTP-01 doğrulaması IPv6'yı da dener → **yanlış kurulumda sertifika yenilenmesi başarısız olabilir.** **Kesinti ihtimali:** nginx `reload` ile (restart değil) 0 kesinti; yalnız AAAA yanlış eklenirse IPv6 istemcilerinde kısmi erişim sorunu.
5. **Rollback:** AAAA kaydını sil (TTL 1800 s → en geç ~30 dk içinde kalkar), nginx'te eklenen `listen [::]` satırlarını geri al ve `nginx -t && systemctl reload nginx`. IPv4 etkilenmez.
6. **DNS yayılımı:** TTL 1800 s; eklemede ve geri almada ~30 dk. Önerilen: eklemeden önce TTL'yi 300 s'ye düşürmek.
7. **Uygulama sonrası testler:** `curl -4`/`curl -6` ile http/https, www + apex; sertifika ve hostname; redirect zincirinin tek hop kalması; `certbot renew --dry-run`; `npm run redirects:check -- --full` (IPv4); Search Console'da kapsam raporu izleme (gönderim yok).

---

## 8. Yan bulgular (bu sprint kapsamında düzeltilmedi)

1. **Sertifika yenileme:** Let's Encrypt sertifikası **2026-12-27** tarihinde bitiyor (kalan ≈ 63 gün). Otomatik yenileme sunucuda doğrulanamadı (SSH yok). Öneri: sunucuda `systemctl list-timers | grep certbot` ve `sudo certbot renew --dry-run` (salt-okunur/simülasyon) ile kontrol edin.
2. **CAA kaydı yok:** isteğe bağlı sertleştirme (`0 issue "letsencrypt.org"`); DNS değişikliği olduğundan ayrı onay.
3. **DNSSEC yok:** zorunlu değil; DNS sağlayıcısı (IHS) destekliyorsa değerlendirilebilir.
4. **DNS sağlayıcısı ile web sunucusu ayrı** (IHS DNS → Hetzner). Sunucu IP'si değişirse A kayıtlarının IHS panelinde güncellenmesi gerekir (TTL 1800 s).
5. **Test metodolojisi dersi:** DNS sonuçları artık filtresiz çıktı + genel DoH çözümleyicileri + yetkili NS ile doğrulanıyor.

## 9. Yönetici cevapları

1. **IPv6 neden çalışmıyor?** Çünkü alan adı için IPv6 yayımlanmamış; "sorun" yanlış okunan bir adresten (yerel DNS çözümleyicisi) kaynaklanıyordu.
2. **DNS'teki IPv6 adresi doğru mu?** DNS'te IPv6 adresi **yok**. `<yerel-DNS-çözümleyici-IPv6>` DNS kaydı değil, yerel ISP'a ait yerel çözümleyici adresidir.
3. **DNS / sunucu / firewall / Nginx?** Hiçbiri. Kaynak: benim tarafımda ölçüm (çıktı okuma) hatası. Sunucu içi IPv6 durumu SSH olmadığı için doğrulanmadı ama gerekli de değil.
4. **En güvenli çözüm:** hiçbir değişiklik yapmamak (Seçenek 0).
5. **Neyi değiştirmeli?** Hiçbir DNS/yapılandırma kaydı. (İsteğe bağlı: sertifika yenileme kontrolü, CAA.)
6. **IPv4 nasıl korunur?** Hiçbir şey değişmediği için aynen korunur; ileride Seçenek A uygulanırsa IPv4 `A` kayıtlarına dokunulmaz, AAAA ayrıca eklenir/silinir.
7. **Rollback:** değişiklik yapılmadığı için gerekmez; Seçenek A'da rollback yöntemi §7 madde 5.
