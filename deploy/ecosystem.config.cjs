/**
 * PM2 yapılandırması — Mezbaha Teknolojileri (Next.js 16, `next start`).
 * HAZIRLIK DOSYASI: sunucuda henüz çalıştırılmadı. Sırlar BURADA YOKTUR.
 *
 * Sırlar/ortam değişkenleri: <APP_DIR>/.env.production (chmod 600, uygulama kullanıcısına ait);
 * Next.js `next start` bu dosyayı kendisi yükler. NEXT_PUBLIC_SITE_URL ayrıca BUILD sırasında
 * gömülür (aynı dosyadan okunur).
 *
 * Kullanım (uygulama kullanıcısıyla, release dizininden):
 *   pm2 startOrReload deploy/ecosystem.config.cjs --update-env
 *   pm2 save
 */
const APP_DIR = process.env.MEZBAHA_APP_DIR || "/srv/mezbaha/current";
const LOG_DIR = process.env.MEZBAHA_LOG_DIR || "/var/log/mezbaha";

module.exports = {
  apps: [
    {
      name: "mezbaha-teknolojileri",
      cwd: APP_DIR,
      // `npm start` yerine doğrudan next bin'i: PM2 sinyalleri (SIGINT/SIGTERM) Node sürecine ulaşır.
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 127.0.0.1 --port 3000",
      exec_mode: "fork", // tek süreç; Next'in kendi worker'ları yeterli, cluster gerekmez
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "20s",
      restart_delay: 3000,
      max_memory_restart: "1G",
      kill_timeout: 10000, // sürdürülen istekler bitsin
      time: true,
      out_file: `${LOG_DIR}/out.log`,
      error_file: `${LOG_DIR}/error.log`,
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1", // yalnızca loopback: dış dünyaya doğrudan açık DEĞİL, nginx arkasında
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
};
