#!/usr/bin/env node
/**
 * S1-01 redirect recovery — DRY-RUN BY DEFAULT.
 *
 *   node prisma/migration/s1-01-redirect-recovery.cjs --phase A                 # dry-run (SELECT only)
 *   node prisma/migration/s1-01-redirect-recovery.cjs --phase B --simulate-after-A
 *   node prisma/migration/s1-01-redirect-recovery.cjs --phase A --apply --confirm=S1-01-APPROVED   # ONLY after explicit written approval
 *
 * Reads docs/seo/USA_SEO_S1_01_REDIRECT_CHANGES.csv.
 * Dry-run performs NO insert/update/delete/DDL and takes no locks.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// ---- Recorded at preflight (2026-10-25). Change only by re-running the preflight. ----
const EXPECTED_TABLE_FP = "03b484d9dc1c907ed5f9c5c5926828adc31dce030f0cdc86f3588ebb09e5e706"; // sha256 over all Redirect rows (id|source|dest|statusCode|active)
const EXPECTED_BUILD_FP = "c22b338b7c66480b6d6813f257b0d20e4b6fd2f8939d27fd8a290e726202b3b4"; // sha256 over live homepage /_next/static chunk URLs
const EXPECTED_ROW_COUNT = 553;
const CSV = path.join(__dirname, "..", "..", "docs", "seo", "USA_SEO_S1_01_REDIRECT_CHANGES.csv");
const ORIGIN = "https://www.mezbahateknolojileri.com";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const a = args.find((x) => x.startsWith(n + "=")); return a ? a.split("=").slice(1).join("=") : args[args.indexOf(n) + 1]; };
const PHASE = val("--phase");
const APPLY = flag("--apply") && val("--confirm") === "S1-01-APPROVED";
if (!["A", "B"].includes(PHASE)) { console.error("--phase A|B gerekli"); process.exit(2); }
if (flag("--apply") && !APPLY) { console.error("--apply için --confirm=S1-01-APPROVED gerekli; dry-run yapılıyor."); }

function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const out = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); out.push(row); row = []; f = ""; } else f += c;
  }
  const h = out[0];
  return out.slice(1).filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const fingerprint = (rows) => crypto.createHash("sha256").update(rows.map((r) => [r.id, r.sourcePath, r.destinationPath, r.statusCode, r.active].join("|")).sort().join("\n")).digest("hex");
const norm = (p) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);

async function liveBuildFingerprint() {
  const html = await (await fetch(ORIGIN + "/", { headers: { "user-agent": "S1-01-guard" } })).text();
  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"']+\.(?:js|css)/g)].map((m) => m[0]))].sort();
  return crypto.createHash("sha256").update(chunks.join("\n")).digest("hex");
}

(async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const plan = parseCsv(fs.readFileSync(CSV, "utf8")).filter((r) => r.action !== "NO_CHANGE" && r.apply_phase === PHASE);
  const report = { phase: PHASE, mode: APPLY ? "APPLY" : "DRY-RUN", planned: plan.length };
  const problems = [];

  // ---- 1) Load table, guards against concurrent changes ----
  let rows = await prisma.redirect.findMany();
  const asState = (r) => ({ id: r.id, sourcePath: r.sourcePath, destinationPath: r.destinationPath, statusCode: r.statusCode, active: r.active });
  let state = rows.map(asState);
  if (flag("--simulate-after-A")) {
    // In-memory only: pretend phase A was applied, to validate phase B planning
    for (const p of parseCsv(fs.readFileSync(CSV, "utf8")).filter((r) => r.apply_phase === "A")) {
      const s = state.find((x) => x.id === p.redirect_id);
      s.active = p.expected_active === "true"; if (p.action === "RESTORE_INACTIVE") s.destinationPath = p.proposed_target;
    }
    report.simulatedAfterA = true;
  } else if (flag("--simulate-applied")) {
    for (const p of parseCsv(fs.readFileSync(CSV, "utf8")).filter((r) => r.action !== "NO_CHANGE")) { const s2 = state.find((x) => x.id === p.redirect_id); s2.active = p.expected_active === "true"; s2.destinationPath = p.proposed_target; }
    report.simulatedApplied = true;
  } else if (PHASE === "A") {
    const fp = fingerprint(state);
    report.tableFingerprintMatches = fp === EXPECTED_TABLE_FP;
    report.rowCount = rows.length;
    if (fp !== EXPECTED_TABLE_FP) problems.push("Redirect tablosu parmak izi preflight ile uyuşmuyor (başka bir değişiklik olmuş) — DURDUR");
    if (rows.length !== EXPECTED_ROW_COUNT) problems.push(`Satır sayısı ${rows.length} != ${EXPECTED_ROW_COUNT}`);
    const bfp = await liveBuildFingerprint();
    report.buildFingerprintMatches = bfp === EXPECTED_BUILD_FP;
    if (bfp !== EXPECTED_BUILD_FP && !flag("--accept-deploy-change")) problems.push("Canlı site build parmak izi değişmiş (yeni deploy?) — DURDUR; yeniden preflight gerekir");
  }

  if (PHASE === "B" && !flag("--simulate-after-A") && !flag("--simulate-applied")) {
    const fpNow = fingerprint(state); const want = val("--expect-fp");
    report.tableFingerprintMatches = fpNow === want;
    if (!want || fpNow !== want) problems.push("Faz B için --expect-fp (Faz A sonrası parmak izi) gerekli ve eşleşmeli");
  }
  // ---- 2) Per-row guard: id + source + current values must match CSV; idempotent skip if already applied ----
  const byId = new Map(state.map((s) => [s.id, s]));
  const todo = [], already = [], mismatch = [];
  for (const p of plan) {
    const s = byId.get(p.redirect_id);
    const wantActive = p.expected_active === "true";
    const curMatches = s && s.sourcePath === p.source_url && s.destinationPath === p.current_target && String(s.active) === p.current_active;
    const doneMatches = s && s.sourcePath === p.source_url && s.destinationPath === p.proposed_target && s.active === wantActive;
    if (doneMatches) already.push(p);
    else if (curMatches) todo.push(p);
    else mismatch.push({ id: p.redirect_id, source: p.source_url, expected: [p.current_target, p.current_active], found: s ? [s.destinationPath, String(s.active)] : "YOK" });
  }
  report.wouldChange = todo.length; report.alreadyApplied = already.length; report.mismatch = mismatch.length;
  if (mismatch.length) problems.push(`${mismatch.length} kayıt beklenen mevcut değerle eşleşmiyor`);

  // ---- 3) Graph safety after the planned change: no chain, no loop, no source == live canonical ----
  const sitemap = new Set((await (await fetch(ORIGIN + "/sitemap.xml")).text()).match(/<loc>[^<]+<\/loc>/g).map((m) => new URL(m.slice(5, -6)).pathname));
  const after = new Map(state.map((s) => [s.id, { ...s }]));
  for (const p of todo) { const s = after.get(p.redirect_id); s.active = p.expected_active === "true"; s.destinationPath = p.proposed_target; }
  const activeAfter = [...after.values()].filter((s) => s.active && !/^\/(images|uploads)\//.test(s.destinationPath));
  const srcSet = new Set(activeAfter.map((s) => norm(s.sourcePath)));
  const chains = activeAfter.filter((s) => srcSet.has(norm(s.destinationPath)) && norm(s.destinationPath) !== norm(s.sourcePath));
  const loops = activeAfter.filter((s) => norm(s.destinationPath) === norm(s.sourcePath));
  const hijack = activeAfter.filter((s) => sitemap.has(norm(s.sourcePath)));
  const destNotInSitemap = activeAfter.filter((s) => todo.some((p) => p.redirect_id === s.id) && !sitemap.has(norm(s.destinationPath)));
  Object.assign(report, { chainsAfter: chains.length, loopsAfter: loops.length, sitemapSourcesAfter: hijack.length, plannedTargetsNotInSitemap: destNotInSitemap.length });
  if (chains.length + loops.length + hijack.length + (PHASE === "B" ? destNotInSitemap.length : 0)) problems.push("Grafik güvenliği ihlali (zincir/döngü/canonical gasp/sitemap dışı hedef)");
  report.unaffectedRows = rows.length - todo.length - already.length;

  // ---- 4) Backup artifacts (only written in APPLY; dry-run prints what would be written) ----
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.env.S1_01_BACKUP_DIR || path.join(__dirname, "..", "..", "..", "_backups"), `redirect-s1-01-${stamp}`);
  report.backupWouldBeWrittenTo = backupDir;

  if (problems.length) { report.problems = problems; console.log(JSON.stringify(report, null, 1)); if (mismatch.length) console.log("MISMATCH:", JSON.stringify(mismatch.slice(0, 5))); await prisma.$disconnect(); process.exitCode = 1; return; }

  if (!APPLY) { console.log(JSON.stringify(report, null, 1)); await prisma.$disconnect(); return; }

  // ---------------- APPLY PATH (never reached in dry-run) ----------------
  fs.mkdirSync(backupDir, { recursive: true });
  const full = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
  fs.writeFileSync(path.join(backupDir, "redirect-table-full.json"), JSON.stringify(full, null, 1));
  const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
  const restore = ["BEGIN;", ...todo.map((p) => { const o = full.find((r) => r.id === p.redirect_id); return `UPDATE "Redirect" SET "destinationPath"=${q(o.destinationPath)}, "active"=${o.active}, "updatedAt"=${q(o.updatedAt)} WHERE "id"=${q(o.id)} AND "destinationPath"=${q(p.proposed_target)};`; }), "COMMIT;"];
  fs.writeFileSync(path.join(backupDir, "restore.sql"), restore.join("\n") + "\n");
  fs.writeFileSync(path.join(backupDir, "backup.sha256"), crypto.createHash("sha256").update(JSON.stringify(full)).digest("hex") + "\n");

  await prisma.$transaction(async (tx) => {
    const [{ locked }] = await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(hashtext('s1-01-redirect-fix')) AS locked`;
    if (!locked) throw new Error("Advisory lock alınamadı — başka bir işlem çalışıyor");
    const ids = todo.map((p) => p.redirect_id);
    await tx.$queryRaw`SELECT id FROM "Redirect" WHERE id = ANY(${ids}) FOR UPDATE`;
    const before = fingerprint((await tx.redirect.findMany()).map(asState));
    if (!flag("--simulate-after-A") && PHASE === "A" && before !== EXPECTED_TABLE_FP) throw new Error("Transaction içinde parmak izi değişmiş");
    for (const p of todo) {
      const res = await tx.redirect.updateMany({
        where: { id: p.redirect_id, sourcePath: p.source_url, destinationPath: p.current_target, active: p.current_active === "true" },
        data: { destinationPath: p.proposed_target, active: p.expected_active === "true" },
      });
      if (res.count !== 1) throw new Error(`Güncelleme beklenmedik sayıda satır etkiledi (${res.count}): ${p.source_url}`);
    }
    const afterRows = await tx.redirect.findMany();
    if (afterRows.length !== rows.length) throw new Error("Satır sayısı değişti");
    const touched = new Set(ids);
    const unchangedBefore = fingerprint(rows.filter((r) => !touched.has(r.id)).map(asState));
    const unchangedAfter = fingerprint(afterRows.filter((r) => !touched.has(r.id)).map(asState));
    if (unchangedBefore !== unchangedAfter) throw new Error("Etkilenmemesi gereken satırlar değişti");
  }, { maxWait: 10000, timeout: 60000 });
  const fpAfter = fingerprint((await prisma.redirect.findMany()).map(asState));
  console.log(JSON.stringify({ ...report, applied: todo.length, backupDir, tableFingerprintAfter: fpAfter }, null, 1));
  console.log("SONRAKİ ADIM: ≥70 sn bekleyin (proxy redirect önbelleği 60 sn), sonra test paketini çalıştırın:  node prisma/migration/s1-01-verify.cjs --expect expected" + (PHASE === "A" ? "  (Faz A sonrası yalnız G1/G2 anlamlıdır; tüm paket Faz B sonrası)" : ""));
  await prisma.$disconnect();
})().catch((e) => { console.error("HATA:", e.message); process.exitCode = 1; });
