import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteSlideAction, importDefaultSlidesAction, moveSlideAction, toggleSlideAction } from "./actions";

/** Ana sayfa hero slaytları: sırala, aç/kapat, düzenle, sil (Norm-Yacht'taki Slider Management gibi). */
export default async function AdminSliderPage() {
  await requireAdmin("EDITOR");
  const slides = await prisma.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const activeCount = slides.filter((s) => s.active).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">Slider Yönetimi</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Ana sayfanın üstündeki hero slaytları. {slides.length} slayt, {activeCount} aktif. Sıra yukarıdan aşağıya doğrudur.
          </p>
        </div>
        <Link href="/admin/slider/yeni" className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium leading-10 text-neutral-900">
          + Yeni Slayt
        </Link>
      </div>

      {slides.length === 0 ? (
        <div className="mt-8 rounded-lg border border-neutral-700 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-200">
            Henüz kayıtlı slayt yok. Şu an site <strong>varsayılan slaytları</strong> gösteriyor (giriş içeriği ve öne çıkan
            ürünler).
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Bunları düzenlemek için varsayılanları içe aktarın, ya da doğrudan yeni bir slayt ekleyin. Kayıtlı en az bir
            aktif slayt olduğunda site yalnızca kayıtlı slaytları gösterir.
          </p>
          <form action={importDefaultSlidesAction} className="mt-4">
            <button type="submit" className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium text-neutral-900">
              Varsayılan slaytları içe aktar
            </button>
          </form>
        </div>
      ) : (
        <>
          {activeCount === 0 && (
            <p role="status" className="mt-6 rounded-md border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Hiç aktif slayt yok, bu yüzden site varsayılan slaytları gösteriyor. En az bir slaytı aktif yapın.
            </p>
          )}
          <ul className="mt-6 flex flex-col gap-3">
            {slides.map((slide, index) => (
              <li key={slide.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-neutral-950">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="128px"
                    className={slide.fit === "contain" ? "object-contain" : "object-cover"}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-100">{slide.title}</p>
                  {slide.subtitle && <p className="mt-0.5 line-clamp-1 text-sm text-neutral-400">{slide.subtitle}</p>}
                  <p className="mt-1 text-xs text-neutral-500">
                    Buton: {slide.buttonText} → {slide.buttonLink}
                  </p>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${slide.active ? "bg-emerald-500/15 text-emerald-300" : "bg-neutral-700 text-neutral-300"}`}>
                  {slide.active ? "Aktif" : "Kapalı"}
                </span>

                <div className="flex items-center gap-1">
                  <form action={moveSlideAction.bind(null, slide.id, "up")}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="Yukarı taşı"
                      className="flex size-9 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                  </form>
                  <form action={moveSlideAction.bind(null, slide.id, "down")}>
                    <button
                      type="submit"
                      disabled={index === slides.length - 1}
                      aria-label="Aşağı taşı"
                      className="flex size-9 items-center justify-center rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>

                <div className="flex items-center gap-4">
                  <form action={toggleSlideAction.bind(null, slide.id)}>
                    <button type="submit" className="text-sm font-medium text-neutral-300 hover:text-white">
                      {slide.active ? "Kapat" : "Aç"}
                    </button>
                  </form>
                  <Link href={`/admin/slider/${slide.id}`} className="text-sm font-medium text-neutral-100 hover:underline">
                    Düzenle
                  </Link>
                  <DeleteButton action={deleteSlideAction.bind(null, slide.id)} confirmMessage={`"${slide.title}" slaytı silinsin mi?`} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
