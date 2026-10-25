#!/usr/bin/env node
/**
 * S1-01 post-fix test suite — HTTP only (GET), no DB access, no writes.
 *
 *   node prisma/migration/s1-01-verify.cjs --expect current            # pre-fix: verifies the snapshot still matches reality (should be ALL PASS)
 *   node prisma/migration/s1-01-verify.cjs --expect expected           # post-fix: verifies the target behaviour (pre-fix this SHOULD fail)
 *   add --full to also crawl all ~820 sitemap URLs (default: stratified sample incl. every locale)
 *
 * Waits are NOT built in: after a DB change wait >= 70 s (proxy redirect cache TTL is 60 s).
 */
const fs = require("fs");
const path = require("path");
const ORIGIN = "https://www.mezbahateknolojileri.com";
const CSV = path.join(__dirname, "..", "..", "docs", "seo", "USA_SEO_S1_01_REDIRECT_CHANGES.csv");
const args = process.argv.slice(2);
const MODE = (args[args.indexOf("--expect") + 1] || "expected");
const FULL = args.includes("--full");
const LOCS = ["tr", "ru", "de", "fr", "ar"];
const locOf = (p) => { const x = p.split("/").filter(Boolean)[0]; return LOCS.includes(x) ? x : "en"; };
const norm = (p) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);
const dec = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

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

const cache = new Map();
async function get(p) {
  if (cache.has(p)) return cache.get(p);
  const prom = (async () => {
    const r = await fetch(ORIGIN + p, { redirect: "manual", headers: { "user-agent": "S1-01-tests/1.0 (read-only)" } });
    const o = { status: r.status, location: r.headers.get("location") || "" };
    if (r.status === 200 && /text\/html/.test(r.headers.get("content-type") || "")) {
      const html = await r.text();
      const g = (re) => (html.match(re) || [])[1] || "";
      o.canonical = dec(g(/<link rel="canonical" href="([^"]*)"/i));
      o.lang = g(/<html[^>]*\blang="([^"]*)"/i);
      o.robots = g(/<meta name="robots" content="([^"]*)"/i);
      o.hreflangs = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/gi)].map((m) => m[1] + "=" + m[2]);
    }
    return o;
  })();
  cache.set(p, prom);
  return prom;
}
async function pool(items, n, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k]); } catch (e) { out[k] = { ok: false, msg: "exception: " + e.message }; } } })); return out; }

const results = {}; // group -> {pass, fail, details[]}
const rec = (group, ok, msg) => { const g = (results[group] ||= { pass: 0, fail: 0, details: [] }); if (ok) g.pass++; else { g.fail++; if (g.details.length < 12) g.details.push(msg); } };
const absTarget = (p) => (p.startsWith("http") ? p : ORIGIN + p);
const pathOf = (u) => norm(new URL(u, ORIGIN).pathname);

(async () => {
  const csv = parseCsv(fs.readFileSync(CSV, "utf8"));
  const sitemapXml = await (await fetch(ORIGIN + "/sitemap.xml")).text();
  const sitemap = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const sitemapSet = new Set(sitemap.map(norm));

  // ---- G1: current English canonical pages: direct 200, self-canonical, lang, hreflang, sitemap ----
  const seven = csv.filter((r) => ["DEACTIVATE", "RESTORE_INACTIVE"].includes(r.action));
  await pool(seven, 6, async (r) => {
    const p = r.source_url, d = await get(p), url = ORIGIN + p;
    if (MODE === "current") { rec("G1 mevcut durum: 7 URL şu an 301 (regresyon doğrulandı)", d.status === 301, `${p}: ${d.status} ${d.location}`); return; }
    rec("G1 güncel EN canonical sayfalar: doğrudan 200", d.status === 200 && !d.location, `${p}: ${d.status} -> ${d.location}`);
    rec("G1 self-canonical", d.canonical === url, `${p}: canonical=${d.canonical}`);
    rec("G1 html lang=en", d.lang === "en", `${p}: lang=${d.lang}`);
    rec("G1 hreflang en + x-default kendisini gösteriyor", (d.hreflangs || []).includes("en=" + url) && (d.hreflangs || []).includes("x-default=" + url), `${p}: ${(d.hreflangs || []).join(" ")}`);
    rec("G1 sitemap üyesi", sitemapSet.has(p), `${p}: sitemap'te yok`);
    rec("G1 indekslenebilir (noindex yok)", !/noindex/i.test(d.robots || ""), `${p}: robots=${d.robots}`);
  });

  // ---- G2: sitemap consistency (direct 200, self-canonical, correct lang, no redirect) ----
  const strat = []; const seen = new Set();
  for (const p of sitemap) { const k = locOf(p) + "|" + (p.split("/").filter(Boolean).slice(locOf(p) === "en" ? 0 : 1)[0] || "home"); const n = (seen.has(k) ? 1 : 0); if (!n || FULL) { strat.push(p); seen.add(k); } }
  const sample = FULL ? sitemap : [...new Set([...strat, ...sitemap.filter((_, i) => i % 12 === 0), ...seven.map((r) => r.source_url)])];
  await pool(sample, 6, async (p) => {
    const d = await get(p), url = ORIGIN + (p === "/" ? "" : p);
    const okStatus = d.status === 200 && !d.location;
    if (MODE === "current" && seven.some((r) => r.source_url === p)) { rec("G2 sitemap URL'leri doğrudan 200 (mevcut: 7 istisna)", true, ""); return; }
    rec("G2 sitemap URL'leri doğrudan 200 (redirect yok)", okStatus, `${p}: ${d.status} -> ${d.location}`);
    if (okStatus) {
      rec("G2 self-canonical", d.canonical === url || d.canonical === ORIGIN + p, `${p}: canonical=${d.canonical}`);
      rec("G2 html lang = yol dili", d.lang === locOf(p), `${p}: lang=${d.lang}`);
    }
  });

  // ---- G3: legacy / redirect sources: single-hop 301, Location exact, target 200 self-canonical, no loop/404 ----
  await pool(csv, 6, async (r) => {
    if (["DEACTIVATE", "RESTORE_INACTIVE"].includes(r.action)) return; // covered by G1
    const s = await get(r.source_url);
    const expectedLoc = MODE === "current" ? r.current_http_behavior.replace(/^301 -> /, "") : (r.action === "UPDATE_TARGET" ? ORIGIN + r.proposed_target : r.current_http_behavior.replace(/^301 -> /, ""));
    rec(`G3 eski URL'ler: tek hop 301 (${MODE})`, s.status === 301, `${r.source_url}: ${s.status}`);
    rec(`G3 Location tam eşleşme (${MODE})`, s.location === expectedLoc, `${r.source_url}: ${s.location} (beklenen ${expectedLoc})`);
    const tp = pathOf(expectedLoc);
    const t = await get(tp);
    if (MODE === "expected" || r.action === "NO_CHANGE") {
      rec("G3 hedef 404 değil", t.status !== 404, `${r.source_url} -> ${tp}: 404`);
      rec("G3 hedef doğrudan 200 (zincir yok)", t.status === 200 && !t.location, `${r.source_url} -> ${tp}: ${t.status} ${t.location}`);
      rec("G3 hedef self-canonical (kanonik hedef)", t.canonical === ORIGIN + tp, `${r.source_url} -> ${tp}: canonical=${t.canonical}`);
      rec("G3 döngü yok (hedef ≠ kaynak)", tp !== norm(r.source_url), `${r.source_url} kendine yönleniyor`);
      rec("G3 dil önekleri uyumlu", locOf(r.source_url) === locOf(tp), `${r.source_url} (${locOf(r.source_url)}) -> ${tp} (${locOf(tp)})`);
    }
  });

  // ---- G4: other languages preserved (TR/RU/DE/FR/AR canonical URLs and their legacy redirects unchanged) ----
  const others = sitemap.filter((p) => locOf(p) !== "en");
  await pool(FULL ? others : others.filter((_, i) => i % 6 === 0), 6, async (p) => {
    const d = await get(p), url = ORIGIN + (p === "/" ? "" : p);
    rec("G4 diğer diller: doğrudan 200 + self-canonical", d.status === 200 && !d.location && d.canonical === url, `${p}: ${d.status} ${d.location} canonical=${d.canonical}`);
  });
  const trRu = csv.filter((r) => ["tr", "ru"].includes(r.language) && r.action === "NO_CHANGE");
  await pool(trRu, 6, async (r) => { const s = await get(r.source_url); rec("G4 değişmeyen TR/RU kuralları aynı davranıyor", s.status === 301 && s.location === r.current_http_behavior.replace(/^301 -> /, ""), `${r.source_url}: ${s.status} ${s.location}`); });

  // ---- report ----
  let failed = 0;
  console.log(`\nS1-01 test paketi — mod: --expect ${MODE}${FULL ? " --full" : " (örneklemli sitemap)"}\n`);
  for (const [g, v] of Object.entries(results).sort()) { failed += v.fail; console.log(`${v.fail ? "FAIL" : "PASS"}  ${g}: ${v.pass} geçti, ${v.fail} kaldı`); v.details.slice(0, 5).forEach((d) => console.log("        - " + d)); }
  console.log(`\nSONUÇ: ${failed ? failed + " test başarısız" : "TÜM TESTLER GEÇTİ"}`);
  process.exitCode = failed ? 1 : 0;
})();
