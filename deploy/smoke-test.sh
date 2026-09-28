#!/usr/bin/env bash
# Deployment sonrası (ve DNS geçişinden ÖNCE origin'e karşı) duman testi. Yalnızca GET/HEAD; hiçbir şey değiştirmez.
#
# Kullanım:
#   # 1) DNS'e dokunmadan, doğrudan yeni origin'e karşı (geçiş öncesi):
#   ORIGIN_IP=<VPS_IP> INSECURE=1 bash deploy/smoke-test.sh
#   # 2) Geçişten sonra canlı DNS'e karşı:
#   bash deploy/smoke-test.sh
#
#   ORIGIN_IP  : verilirse apex+www bu IP'ye sabitlenir (curl --resolve; Cloudflare atlanır)
#   INSECURE=1 : Cloudflare Origin CA sertifikası genel olarak güvenilir olmadığından -k kullanır
set -u

WWW="www.mezbahateknolojileri.com"
APEX="mezbahateknolojileri.com"
CANON="https://${WWW}"
PASS=0; FAIL=0

CURL=(curl -s -o /dev/null --max-time 20)
[ "${INSECURE:-0}" = "1" ] && CURL+=(-k)
if [ -n "${ORIGIN_IP:-}" ]; then
  CURL+=(--resolve "${WWW}:443:${ORIGIN_IP}" --resolve "${APEX}:443:${ORIGIN_IP}" --resolve "${WWW}:80:${ORIGIN_IP}" --resolve "${APEX}:80:${ORIGIN_IP}")
fi

check() { # ad, beklenen_kod, beklenen_location_veya_-, url...
  local name="$1" code="$2" loc="$3"; shift 3
  local out; out="$("${CURL[@]}" -w '%{http_code} %{redirect_url}' "$@" 2>/dev/null)"
  local got_code="${out%% *}" got_loc="${out#* }"
  if [ "$got_code" = "$code" ] && { [ "$loc" = "-" ] || [ "$got_loc" = "$loc" ]; }; then
    PASS=$((PASS+1)); printf 'PASS  %-58s %s\n' "$name" "$got_code"
  else
    FAIL=$((FAIL+1)); printf 'FAIL  %-58s got "%s" want "%s %s"\n' "$name" "$out" "$code" "$loc"
  fi
}

echo "== 4 giriş noktası (tek adım, yol+sorgu korunur)"
check "http://apex/         -> https://www/"            301 "${CANON}/"            "http://${APEX}/"
check "http://www/          -> https://www/"            301 "${CANON}/"            "http://${WWW}/"
check "https://apex/        -> https://www/"            301 "${CANON}/"            "https://${APEX}/"
check "https://www/         -> 200"                     200 -                      "${CANON}/"
check "http://apex/urunler?a=1 (yol+sorgu)"             301 "${CANON}/urunler?a=1" "http://${APEX}/urunler?a=1"
check "https://apex/tr/kataloglar/ (yol korunur)"       301 "${CANON}/tr/kataloglar/" "https://${APEX}/tr/kataloglar/"

echo "== Eski (legacy) URL'ler: sondaki '/' ile, TEK adım 301 (Phase 11D)"
check "/tr/kataloglar/"                                  301 "${CANON}/kataloglar" "${CANON}/tr/kataloglar/"
check "/tr/mezbaha-makina-sistemleri-katalog/"           301 "${CANON}/kataloglar/2018-mezbaha-sistemleri-katalog" "${CANON}/tr/mezbaha-makina-sistemleri-katalog/"
check "/tr/mezbaha-sistemleri-videolar-941/"             301 "${CANON}/videolar" "${CANON}/tr/mezbaha-sistemleri-videolar-941/"
check "/tr/endustriyel-sogutma-sistemleri/"              301 "${CANON}/hizmetler/endustriyel-sogutma-sistemleri" "${CANON}/tr/endustriyel-sogutma-sistemleri/"
check "/tr/online-magazamiz-yayinda/"                    301 "${CANON}/blog/online-magazamiz-yayinda" "${CANON}/tr/online-magazamiz-yayinda/"
check "/tr/buyukbas-mezbaha-makinalari/"                 301 "${CANON}/urunler/buyukbas" "${CANON}/tr/buyukbas-mezbaha-makinalari/"
check "legacy + sorgu korunur"                           301 "${CANON}/kataloglar?utm_source=x" "${CANON}/tr/kataloglar/?utm_source=x"
check "normal sayfa sondaki '/' -> 308 (tek adım)"       308 "${CANON}/urunler" "${CANON}/urunler/"

echo "== Kanonik sayfalar 200"
for p in / /urunler /urunler/buyukbas /projeler /blog /kataloglar /kataloglar/2018-mezbaha-sistemleri-katalog /videolar /hizmetler /hizmetler/endustriyel-sogutma-sistemleri /hakkimizda /iletisim /sitemap.xml /robots.txt /llms.txt; do
  check "GET ${p}" 200 - "${CANON}${p}"
done

echo "== Admin oturumsuz -> login, 404 doğru"
check "/admin (oturumsuz)"                               307 "${CANON}/admin/login" "${CANON}/admin"
check "olmayan sayfa 404"                                404 - "${CANON}/bu-sayfa-yok-12345"

echo "== İçerik doğrulama: robots/sitemap/llms/canonical yalnızca üretim origin'i, localhost yok"
body() { curl -s --max-time 20 $([ "${INSECURE:-0}" = "1" ] && echo -k) $([ -n "${ORIGIN_IP:-}" ] && echo "--resolve ${WWW}:443:${ORIGIN_IP}") "$@"; }
for f in /robots.txt /sitemap.xml /llms.txt /; do
  content="$(body "${CANON}${f}")"
  if echo "$content" | grep -qiE 'localhost|127\.0\.0\.1|placeholder'; then FAIL=$((FAIL+1)); echo "FAIL  ${f}: localhost/placeholder bulundu"; else PASS=$((PASS+1)); echo "PASS  ${f}: localhost/placeholder yok"; fi
done
canon="$(body "${CANON}/urunler" | grep -o 'rel="canonical" href="[^"]*"' | head -1)"
[ "$canon" = "rel=\"canonical\" href=\"${CANON}/urunler\"" ] && { PASS=$((PASS+1)); echo "PASS  /urunler canonical = ${CANON}/urunler"; } || { FAIL=$((FAIL+1)); echo "FAIL  /urunler canonical: $canon"; }

echo "== Başlıklar"
hdr="$(curl -sI --max-time 20 $([ "${INSECURE:-0}" = "1" ] && echo -k) $([ -n "${ORIGIN_IP:-}" ] && echo "--resolve ${WWW}:443:${ORIGIN_IP}") "${CANON}/")"
for h in strict-transport-security x-content-type-options x-frame-options referrer-policy permissions-policy; do
  echo "$hdr" | grep -qi "^${h}:" && { PASS=$((PASS+1)); echo "PASS  header ${h}"; } || { FAIL=$((FAIL+1)); echo "FAIL  header ${h} yok"; }
done
echo "$hdr" | grep -qi '^x-powered-by:' && { FAIL=$((FAIL+1)); echo "FAIL  x-powered-by görünüyor"; } || { PASS=$((PASS+1)); echo "PASS  x-powered-by yok"; }

echo
echo "SONUÇ: ${PASS} geçti, ${FAIL} kaldı"
[ "$FAIL" -eq 0 ]
