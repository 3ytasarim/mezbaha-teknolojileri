/**
 * Ana sayfadaki "Satış Ağımız" bölümü için noktalı dünya haritası (statik SVG) üretir.
 * 21st.dev "Map" bileşeninin kullandığı `dotted-map` kütüphanesiyle; pinler HTML katmanı olarak
 * bileşende çizildiği için SVG'de yalnızca kara noktaları vardır.
 *
 * Kullanım: npx tsx prisma/migration/generate-world-map.ts
 * Çıktı:    public/images/sales-network/world-dots.svg
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import DottedMap from "dotted-map";

// 21st.dev "Map" bileşeniyle AYNI ayarlar (height 100, diagonal grid; radius 0.22; siyahın %25'i).
const map = new DottedMap({ height: 100, grid: "diagonal" });
const svg = map.getSVG({ radius: 0.22, color: "#00000040", shape: "circle", backgroundColor: "transparent" });

const out = path.join(__dirname, "..", "..", "public", "images", "sales-network", "world-dots.svg");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, svg, "utf-8");
console.log("yazıldı:", path.relative(process.cwd(), out), (svg.length / 1024).toFixed(0) + " KB");
