/** Masaüstündeki 3 kare kapağı 16:9 (1600x900) WebP'ye çevirir: görsel kırpılmaz (başlık bandı + makine korunur), yanlar kendi bulanık kopyasıyla doldurulur. */
const sharp = require("sharp");
const path = require("path");
const D = path.join(require("os").homedir(), "Desktop");
const OUT = path.join(__dirname, "images");
const JOBS = [
  ["EVISCERA PNEUMATIC PLATFORM.jpeg", "cover-1.webp"],
  ["LEG AND HORN CUTTING SAW.jpeg", "cover-2.webp"],
  ["PNEUMATIC PLATFORM.jpeg", "cover-3.webp"],
];
(async () => {
  for (const [src, dst] of JOBS) {
    const input = path.join(D, src);
    const bg = await sharp(input).resize(1600, 900, { fit: "cover", position: "centre" }).blur(28).modulate({ brightness: 1.02 }).toBuffer();
    const fg = await sharp(input).resize({ height: 900, fit: "inside" }).toBuffer();
    await sharp(bg).composite([{ input: fg, gravity: "centre" }]).webp({ quality: 82, effort: 5 }).toFile(path.join(OUT, dst));
    const m = await sharp(path.join(OUT, dst)).metadata();
    console.log(dst, m.width + "x" + m.height, (require("fs").statSync(path.join(OUT, dst)).size / 1024).toFixed(0) + " KB");
  }
})();
