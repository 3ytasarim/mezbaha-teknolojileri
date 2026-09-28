import Image from "next/image";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { MediaUploadForm } from "./media-upload-form";
import { MediaDeleteButton } from "./media-delete-button";
import { saveMediaAltAction } from "./actions";

export default async function AdminMediaPage() {
  await requireAdmin();

  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Medya Kütüphanesi</h1>

      <div className="mt-6 max-w-md">
        <MediaUploadForm />
      </div>

      <p className="mt-4 max-w-2xl text-sm text-neutral-400">
        Her görsele kısa bir <strong className="text-neutral-200">alt metin</strong> yazın: görseli göremeyenler ve arama motorları için açıklamadır
        (SEO). Kütüphaneden bir görsel seçtiğinizde bu metin ürün/blog/proje formuna otomatik gelir. Dosya adları yüklenirken otomatik olarak
        okunaklı hale getirilir.
        {media.filter((m) => m.mimeType.startsWith("image/") && !m.alt).length > 0 && (
          <span className="ml-1 text-amber-300">
            {media.filter((m) => m.mimeType.startsWith("image/") && !m.alt).length} görselde alt metin eksik.
          </span>
        )}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {media.map((item) => (
          <div key={item.id} className="flex flex-col gap-2">
            <div className="relative aspect-square overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
              {item.mimeType.startsWith("image/") ? (
                <Image src={item.url} alt={item.alt ?? ""} fill sizes="160px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-neutral-400">
                  PDF
                </span>
              )}
            </div>
            <p className="truncate text-xs text-neutral-400" title={item.originalName}>
              {item.originalName}
            </p>
            {item.mimeType.startsWith("image/") && (
              <form action={saveMediaAltAction} className="flex flex-col gap-1.5">
                <input type="hidden" name="id" value={item.id} />
                <label htmlFor={`alt-${item.id}`} className="sr-only">
                  Alt metin — {item.originalName}
                </label>
                <input
                  id={`alt-${item.id}`}
                  name="alt"
                  defaultValue={item.alt ?? ""}
                  maxLength={160}
                  placeholder="Alt metin (görselde ne var?)"
                  className={`h-9 rounded-md border bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-400 ${item.alt ? "border-neutral-700" : "border-amber-400/50"}`}
                />
                <button type="submit" className="h-8 rounded-md border border-neutral-700 text-xs text-neutral-200 hover:bg-neutral-800">
                  Alt metni kaydet
                </button>
              </form>
            )}
            <MediaDeleteButton id={item.id} name={item.originalName} />
          </div>
        ))}
        {media.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-neutral-500">
            Henüz medya yüklenmedi.
          </p>
        )}
      </div>
    </div>
  );
}
