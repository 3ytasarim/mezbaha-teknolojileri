import fs from "node:fs";
import path from "node:path";
import type { RedirectInput, RedirectStore, RedirectTx, StoredRedirect } from "../../src/lib/seo/redirect-service";

/** Üretim verisine DOKUNMAYAN, bellek içi sahte depo. `lock=false` kilitsiz (yarış durumunu gösteren negatif kontrol). */
export class MemStore implements RedirectStore {
  rows: StoredRedirect[];
  private chain: Promise<unknown> = Promise.resolve();
  private seq = 0;
  constructor(rows: Omit<StoredRedirect, "id">[] = [], private lock = true, private delayMs = 0) {
    this.rows = rows.map((r) => ({ ...r, id: `r${++this.seq}` }));
  }
  private tx(): RedirectTx {
    const sleep = () => (this.delayMs ? new Promise((r) => setTimeout(r, this.delayMs)) : Promise.resolve());
    return {
      listAll: async () => {
        const snap = this.rows.map((r) => ({ ...r }));
        await sleep();
        return snap;
      },
      create: async (input: RedirectInput) => {
        await sleep();
        const row = { ...input, id: `r${++this.seq}` };
        this.rows.push(row);
        return { ...row };
      },
      update: async (id, patch) => {
        await sleep();
        const i = this.rows.findIndex((r) => r.id === id);
        this.rows[i] = { ...this.rows[i], ...patch };
      },
    };
  }
  withLock<T>(fn: (tx: RedirectTx) => Promise<T>): Promise<T> {
    if (!this.lock) return fn(this.tx());
    const run = this.chain.then(() => fn(this.tx()));
    this.chain = run.catch(() => undefined);
    return run;
  }
}

export const rule = (sourcePath: string, destinationPath: string, active = true, statusCode = 301): Omit<StoredRedirect, "id"> => ({
  sourcePath,
  destinationPath,
  statusCode,
  active,
});

/** Sitemap'ten türetilmiş küçük, İZOLE canonical örneği (ürün, kategori, statik sayfalar; EN/RU/TR). */
export const CANONICAL_FIXTURE: ReadonlySet<string> = new Set([
  "/", "/products", "/contact-us", "/corporate", "/projects", "/catalogs", "/references", "/videos", "/services", "/get-quote", "/blog",
  "/products/cattle-slaughterhouse", "/products/sheep-slaughterhouse", "/products/mini-slaughterhouse", // kategoriler
  "/product/slaughterhouse-hook", "/product/bleeding-pan", "/product/blood-tank", // ürünler
  "/ru/produkty", "/ru/produkty/skotobojnya", "/ru/produkt/krjuk-dlja-uboja", "/ru/kompaniya",
  "/tr/urunler", "/tr/urun/kesim-kancasi", "/tr/hakkimizda",
]);
export const provider = (set: ReadonlySet<string> | null = CANONICAL_FIXTURE) => async () => set;

type Row = Record<string, string>;
export function readS101Csv(): Row[] {
  const text = fs.readFileSync(path.join(__dirname, "..", "..", "docs", "seo", "USA_SEO_S1_01_REDIRECT_CHANGES.csv"), "utf8").replace(/^﻿/, "");
  const out: string[][] = [];
  let row: string[] = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        f += '"';
        i++;
      } else if (c === '"') q = false;
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(f);
      f = "";
    } else if (c === "\n") {
      row.push(f);
      out.push(row);
      row = [];
      f = "";
    } else f += c;
  }
  const h = out[0];
  return out.slice(1).filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
