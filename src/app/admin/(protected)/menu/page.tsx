import { ArrowDown, ArrowUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DEFAULT_NAV, NAV_LOCATIONS } from "@/lib/navigation";
import { addItemAction, deleteItemAction, importDefaultsAction, moveItemAction, updateItemAction } from "./actions";

const input =
  "h-10 min-w-0 rounded-md border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none focus:border-neutral-400";

/** Site menüsü: üst menü (sol/sağ) ve alt bilgi Kurumsal sütunu. Bir konumda kayıt yoksa varsayılan bağlantılar gösterilir. */
export default async function AdminMenuPage({ searchParams }: PageProps<"/admin/menu">) {
  await requireAdmin("ADMIN");
  const sp = await searchParams;
  const error = typeof sp.hata === "string" ? sp.hata : "";

  const items = await prisma.navigationItem.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Menü Yönetimi</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Sitenin üst menüsü ve alt bilgi bağlantıları. Bir konumda hiç aktif kayıt yoksa varsayılan bağlantılar gösterilir. <code className="text-neutral-300">/urunler</code>{" "}
        bağlantısı üst menüde kategori açılır menüsü olarak görünür.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {NAV_LOCATIONS.map((loc) => {
          const rows = items.filter((i) => i.location === loc.key);
          return (
            <section key={loc.key} aria-labelledby={`h-${loc.key}`}>
              <h2 id={`h-${loc.key}`} className="text-base font-semibold text-neutral-100">
                {loc.label}
              </h2>

              {rows.length === 0 ? (
                <div className="mt-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
                  <p className="text-sm text-neutral-300">Kayıtlı bağlantı yok; site varsayılanları gösteriyor:</p>
                  <p className="mt-2 text-sm text-neutral-400">{DEFAULT_NAV[loc.key].map((d) => d.label).join(" · ")}</p>
                  <form action={importDefaultsAction.bind(null, loc.key)} className="mt-3">
                    <button type="submit" className="h-9 rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900">
                      Varsayılanları içe aktar (düzenlenebilir yap)
                    </button>
                  </form>
                </div>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {rows.map((row, index) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                      <form action={updateItemAction.bind(null, row.id)} className="flex flex-1 flex-wrap items-center gap-2">
                        <input name="label" defaultValue={row.label} aria-label="Etiket" required className={`${input} w-44`} />
                        <input name="url" defaultValue={row.url} aria-label="Bağlantı" required className={`${input} min-w-[12rem] flex-1`} />
                        <label className="flex items-center gap-1.5 text-sm text-neutral-300">
                          <input type="checkbox" name="active" defaultChecked={row.active} className="h-4 w-4" />
                          Aktif
                        </label>
                        <button type="submit" className="h-9 rounded-md border border-neutral-600 px-3 text-sm text-neutral-100 hover:bg-neutral-800">
                          Kaydet
                        </button>
                      </form>

                      <div className="flex items-center gap-1">
                        <form action={moveItemAction.bind(null, row.id, "up")}>
                          <button
                            type="submit"
                            disabled={index === 0}
                            aria-label="Yukarı taşı"
                            className="flex size-9 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 disabled:opacity-30"
                          >
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </button>
                        </form>
                        <form action={moveItemAction.bind(null, row.id, "down")}>
                          <button
                            type="submit"
                            disabled={index === rows.length - 1}
                            aria-label="Aşağı taşı"
                            className="flex size-9 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 disabled:opacity-30"
                          >
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </button>
                        </form>
                        <form action={deleteItemAction.bind(null, row.id)}>
                          <button type="submit" className="ml-1 h-9 px-2 text-sm font-medium text-red-300 hover:text-red-200">
                            Sil
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form action={addItemAction.bind(null, loc.key)} className="mt-3 flex flex-wrap items-center gap-2">
                <input name="label" placeholder="Yeni etiket" aria-label="Yeni bağlantı etiketi" required className={`${input} w-44`} />
                <input name="url" placeholder="/sayfa-adresi" aria-label="Yeni bağlantı adresi" required className={`${input} min-w-[12rem] flex-1`} />
                <button type="submit" className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium text-neutral-900">
                  + Ekle
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
