import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { updateQuoteStatusAction } from "./actions";
import type { SubmissionStatus } from "@prisma/client";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişime geçildi",
  IN_PROGRESS: "Devam ediyor",
  CLOSED: "Kapandı",
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  NEW: "bg-amber-500/15 text-amber-300",
  CONTACTED: "bg-sky-500/15 text-sky-300",
  IN_PROGRESS: "bg-violet-500/15 text-violet-300",
  CLOSED: "bg-neutral-700 text-neutral-300",
};

/** Sitedeki teklif formundan (/teklif-al) gelen talepler (en yeni üstte). */
export default async function AdminQuoteRequestsPage() {
  await requireAdmin();
  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { include: { translations: { where: { locale: "tr" } } } } },
  });
  const newCount = quotes.filter((q) => q.status === "NEW").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Teklif Talepleri</h1>
        <span className="text-sm text-neutral-400">
          {quotes.length} talep · {newCount} yeni
        </span>
      </div>

      {quotes.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-400">Henüz teklif formundan talep gelmedi.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {quotes.map((q) => (
            <li key={q.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-100">
                    {q.name} <span className="text-sm font-normal text-neutral-400">· {q.company}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-400">
                    <a href={`mailto:${q.email}`} className="underline underline-offset-4">
                      {q.email}
                    </a>
                    {" · "}
                    <a href={`tel:${q.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">
                      {q.phone}
                    </a>
                    {" · "}
                    {q.country}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <time dateTime={q.createdAt.toISOString()} className="text-xs text-neutral-500">
                    {q.createdAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
                </div>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                {q.product && (
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">Ürün</dt>
                    <dd className="text-neutral-200">{q.product.translations[0]?.name ?? q.product.slug}</dd>
                  </div>
                )}
                {q.projectType && (
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">Proje</dt>
                    <dd className="text-neutral-200">{q.projectType}</dd>
                  </div>
                )}
                {q.capacity && (
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">Kapasite</dt>
                    <dd className="text-neutral-200">{q.capacity}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">{q.message}</p>

              <form action={updateQuoteStatusAction} className="mt-4 flex items-center gap-2">
                <input type="hidden" name="id" value={q.id} />
                <label htmlFor={`qs-${q.id}`} className="sr-only">
                  Durum
                </label>
                <select
                  id={`qs-${q.id}`}
                  name="status"
                  defaultValue={q.status}
                  className="h-9 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-sm text-neutral-200"
                >
                  {Object.entries(STATUS_LABEL).map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
                <button type="submit" className="h-9 rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-900">
                  Durumu Kaydet
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
