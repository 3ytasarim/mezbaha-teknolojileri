#!/usr/bin/env node
/**
 * S1-01 ROLLBACK — dry-run by default.
 *
 *   node prisma/migration/s1-01-redirect-rollback.cjs --backup <backup-dir>                       # dry-run: shows what would be restored
 *   node prisma/migration/s1-01-redirect-rollback.cjs --backup <backup-dir> --apply --confirm=S1-01-ROLLBACK   # restore (guarded, transactional)
 *   node prisma/migration/s1-01-redirect-rollback.cjs --backup <backup-dir> --simulate-applied    # in-memory rehearsal: apply plan, then restore, compare fingerprints
 *
 * Restores ONLY rows listed in the CSV (action != NO_CHANGE), by id, and only if the row still has the value this
 * migration wrote (so later, unrelated edits are never overwritten). Original updatedAt is restored by restore.sql;
 * this script (Prisma) lets updatedAt bump — use restore.sql if exact timestamps matter.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const args = process.argv.slice(2);
const val = (n) => { const a = args.find((x) => x.startsWith(n + "=")); if (a) return a.split("=").slice(1).join("="); const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const BACKUP = val("--backup");
const APPLY = args.includes("--apply") && val("--confirm") === "S1-01-ROLLBACK";
const CSV = path.join(__dirname, "..", "..", "docs", "seo", "USA_SEO_S1_01_REDIRECT_CHANGES.csv");
if (!BACKUP) { console.error("--backup <dizin> gerekli"); process.exit(2); }

function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const out = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); out.push(row); row = []; f = ""; } else f += c; }
  const h = out[0]; return out.slice(1).filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const fp = (rows) => crypto.createHash("sha256").update(rows.map((r) => [r.id, r.sourcePath, r.destinationPath, r.statusCode, r.active].join("|")).sort().join("\n")).digest("hex");

(async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const backup = JSON.parse(fs.readFileSync(path.join(BACKUP, "redirect-table-full.json"), "utf8"));
  const backupHash = crypto.createHash("sha256").update(JSON.stringify(backup)).digest("hex");
  const recorded = fs.existsSync(path.join(BACKUP, "backup.sha256")) ? fs.readFileSync(path.join(BACKUP, "backup.sha256"), "utf8").trim() : null;
  const plan = parseCsv(fs.readFileSync(CSV, "utf8")).filter((r) => r.action !== "NO_CHANGE");
  const backupById = new Map(backup.map((r) => [r.id, r]));
  let live = (await prisma.redirect.findMany()).map((r) => ({ id: r.id, sourcePath: r.sourcePath, destinationPath: r.destinationPath, statusCode: r.statusCode, active: r.active }));
  if (args.includes("--simulate-applied")) for (const p of plan) { const s = live.find((x) => x.id === p.redirect_id); s.destinationPath = p.proposed_target; s.active = p.expected_active === "true"; }
  const liveById = new Map(live.map((r) => [r.id, r]));

  const toRestore = [], alreadyOriginal = [], conflicts = [];
  for (const p of plan) {
    const o = backupById.get(p.redirect_id), l = liveById.get(p.redirect_id);
    if (!o || !l) { conflicts.push({ id: p.redirect_id, why: "yedekte/canlıda yok" }); continue; }
    if (l.destinationPath === o.destinationPath && l.active === o.active) alreadyOriginal.push(p.redirect_id);
    else if (l.destinationPath === p.proposed_target && String(l.active) === p.expected_active) toRestore.push({ id: p.redirect_id, from: [l.destinationPath, l.active], to: [o.destinationPath, o.active] });
    else conflicts.push({ id: p.redirect_id, source: p.source_url, why: "satır bu migration'ın yazdığı değerde değil (sonradan değişmiş); dokunulmaz", live: [l.destinationPath, l.active] });
  }
  const report = { backupSha256Matches: recorded ? recorded === backupHash : "kayıt yok", planned: plan.length, wouldRestore: toRestore.length, alreadyOriginal: alreadyOriginal.length, conflicts: conflicts.length, mode: APPLY ? "APPLY" : "DRY-RUN" };

  if (args.includes("--simulate-applied")) {
    const after = live.map((r) => { const t = toRestore.find((x) => x.id === r.id); return t ? { ...r, destinationPath: t.to[0], active: t.to[1] } : r; });
    report.rehearsal = { fingerprintAfterRestoreEqualsOriginalBackup: fp(after) === fp(backup.map((r) => ({ id: r.id, sourcePath: r.sourcePath, destinationPath: r.destinationPath, statusCode: r.statusCode, active: r.active }))) };
  }
  if (conflicts.length) report.conflictSample = conflicts.slice(0, 5);
  if (!APPLY) { console.log(JSON.stringify(report, null, 1)); await prisma.$disconnect(); return; }
  if (conflicts.length && !args.includes("--skip-conflicts")) { console.log(JSON.stringify(report, null, 1)); console.error("Çakışma var; --skip-conflicts ile yalnız çakışmayanlar geri alınır."); process.exitCode = 1; await prisma.$disconnect(); return; }

  await prisma.$transaction(async (tx) => {
    const [{ locked }] = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(hashtext('s1-01-redirect-fix')) AS locked`;
    if (!locked) throw new Error("Advisory lock alınamadı");
    for (const t of toRestore) {
      const res = await tx.redirect.updateMany({ where: { id: t.id, destinationPath: t.from[0], active: t.from[1] }, data: { destinationPath: t.to[0], active: t.to[1] } });
      if (res.count !== 1) throw new Error("Geri alma beklenmedik sayıda satır etkiledi: " + t.id);
    }
  }, { maxWait: 10000, timeout: 60000 });
  console.log(JSON.stringify({ ...report, restored: toRestore.length }, null, 1));
  await prisma.$disconnect();
})().catch((e) => { console.error("HATA:", e.message); process.exitCode = 1; });
