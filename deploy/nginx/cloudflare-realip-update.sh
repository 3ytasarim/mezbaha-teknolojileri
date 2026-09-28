#!/usr/bin/env bash
# Cloudflare IP aralıklarını RESMİ listelerden çekip nginx `real_ip` yapılandırmasını üretir.
# Amaç: nginx'in $remote_addr'ı Cloudflare IP'si yerine GERÇEK ziyaretçi IP'si (CF-Connecting-IP) olsun
# (oran sınırlama ve log doğruluğu için). Aralıklar zamanla değişebilir → periyodik çalıştırın (cron/systemd timer).
#
# HAZIRLIK DOSYASI — çalıştırılmadı. Sunucuda root olarak: bash cloudflare-realip-update.sh
set -euo pipefail

OUT=/etc/nginx/conf.d/cloudflare-realip.conf
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

{
  echo "# Otomatik üretildi: $(date -u +%FT%TZ) — kaynak: https://www.cloudflare.com/ips-v4 ve /ips-v6"
  for list in ips-v4 ips-v6; do
    curl -fsS --max-time 20 "https://www.cloudflare.com/${list}" | while read -r cidr; do
      # Yalnızca CIDR biçimine uyan satırlar kabul edilir (beklenmedik içerik yapılandırmayı bozmasın)
      if [[ "$cidr" =~ ^[0-9a-fA-F:.]+/[0-9]{1,3}$ ]]; then
        echo "set_real_ip_from ${cidr};"
      fi
    done
  done
  echo "real_ip_header CF-Connecting-IP;"
  echo "real_ip_recursive on;"
} > "$TMP"

# En az bir IPv4 ve bir IPv6 aralığı gelmiş olmalı
grep -q '^set_real_ip_from [0-9.]*/' "$TMP" || { echo "IPv4 aralığı alınamadı, iptal." >&2; exit 1; }
grep -q '^set_real_ip_from [0-9a-fA-F]*:' "$TMP" || { echo "IPv6 aralığı alınamadı, iptal." >&2; exit 1; }

install -m 644 "$TMP" "$OUT"
nginx -t
systemctl reload nginx
echo "Güncellendi: $OUT ($(grep -c set_real_ip_from "$OUT") aralık)"
