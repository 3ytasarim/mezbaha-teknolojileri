import Image from "next/image";
import { Download } from "lucide-react";
import { catalogPagePath, type Catalog } from "@/lib/legacy-content";
import { CatalogControls } from "./catalog-controls";
import { getI18n } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";

const CONTAINER_ID = "catalog-pages";

/** Gerçek PDF kataloğu: tarayıcı içi gömülü görüntüleyici + belirgin indirme düğmesi. */
function PdfCatalogViewer({ catalog, downloadLabel }: { catalog: Extract<Catalog, { format: "pdf" }>; downloadLabel: string }) {
  const sizeMb = (catalog.pdfSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="mt-10 flex flex-col gap-4">
      <a
        href={catalog.pdfPath}
        download
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-primary/90"
      >
        <Download className="size-5" aria-hidden="true" />
        {downloadLabel}
      </a>
      <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
        <object data={catalog.pdfPath} type="application/pdf" className="h-[80vh] w-full" aria-label={catalog.title}>
          <p className="p-6 text-sm text-muted-foreground">
            <a href={catalog.pdfPath} className="font-semibold text-primary underline" target="_blank" rel="noopener noreferrer">
              {catalog.title}
            </a>
          </p>
        </object>
      </div>
      <p className="text-xs text-muted-foreground">PDF · {sizeMb} MB · {catalog.pageCount} sayfa</p>
    </div>
  );
}

/**
 * Sayfa görselleri sunucuda render edilir (yatay scroll-snap, JS'siz de çalışır, görseller lazy).
 * Katalog kaynakta PDF değil sayfa görselleridir; metin katmanı yoktur → her görselin alt metni
 * yalnızca gerçek verilerden (katalog başlığı + sayfa numarası) oluşur.
 */
async function ImageGalleryCatalogViewer({ catalog }: { catalog: Extract<Catalog, { pagePathPattern: string }> }) {
  const { d } = await getI18n();
  const c = d.catalogs;
  const pages = Array.from({ length: catalog.pageCount }, (_, i) => i + 1);

  return (
    <div className="mt-10">
      <CatalogControls containerId={CONTAINER_ID} total={catalog.pageCount} />

      <ol
        id={CONTAINER_ID}
        tabIndex={0}
        aria-label={format(c.viewerAria, { title: catalog.title })}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {pages.map((page) => (
          <li
            key={page}
            data-page={page}
            className="w-[92%] shrink-0 snap-center sm:w-[80%] lg:w-[68%]"
            aria-label={format(c.pageOf, { page: String(page), n: String(catalog.pageCount) })}
          >
            <Image
              src={catalogPagePath(catalog, page)}
              alt={`${catalog.title} — ${format(c.pageOf, { page: String(page), n: String(catalog.pageCount) })}`}
              width={catalog.pageWidth}
              height={catalog.pageHeight}
              sizes="(min-width: 1024px) 68vw, (min-width: 640px) 80vw, 92vw"
              quality={80}
              className="h-auto w-full border border-border bg-muted"
              {...(page === 1 ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

export async function CatalogViewer({ catalog }: { catalog: Catalog }) {
  if (catalog.format === "pdf") {
    const { d } = await getI18n();
    return <PdfCatalogViewer catalog={catalog} downloadLabel={d.catalogs.download} />;
  }
  return <ImageGalleryCatalogViewer catalog={catalog} />;
}
