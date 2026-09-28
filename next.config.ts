import type { NextConfig } from "next";

/**
 * Güvenli, uygulamayı bozmayan temel güvenlik başlıkları (Phase 11C).
 * CSP bilinçli olarak EKLENMEDİ: inline JSON-LD / Next runtime script'leri için nonce tabanlı
 * bir politika ayrıca tasarlanıp test edilmeli (bkz. docs/phase-11c-report.md, Known Issues).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Yalnızca HTTPS üzerinden anlamlıdır; localhost'ta tarayıcılar yok sayar.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Sondaki "/" yönetimi src/proxy.ts içinde (eski URL redirect zinciri olmasın diye).
  skipTrailingSlashRedirect: true,
  // Streaming metadata kapatıldı: canonical/description/OG etiketleri TÜM istemcilere (AI tarayıcıları
  // dahil) <head> içinde gelir. Varsayılan bot listesi OAI-SearchBot/ChatGPT-User/ClaudeBot/
  // Claude-SearchBot/PerplexityBot'ı kapsamıyordu; metadata gövdenin sonuna akıtılıyordu.
  htmlLimitedBots: /.*/,
  experimental: {
    // Medya yükleme server action'ı 8 MB'a izin veriyor (src/app/admin/(protected)/medya/actions.ts);
    // Next varsayılanı 1 MB olduğundan daha büyük yüklemeler production'da reddediliyordu.
    // Multipart ek yükü için pay bırakıldı. nginx client_max_body_size bunun üstünde olmalı (12m).
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
