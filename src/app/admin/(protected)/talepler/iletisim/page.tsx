import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { updateContactStatusAction } from "./actions";
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

/** Sitedeki iletişim formundan gelen mesajlar (en yeni üstte). */
export default async function AdminContactSubmissionsPage() {
  await requireAdmin();
  const submissions = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const newCount = submissions.filter((s) => s.status === "NEW").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">İletişim Mesajları</h1>
        <span className="text-sm text-neutral-400">
          {submissions.length} mesaj · {newCount} yeni
        </span>
      </div>

      {submissions.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-400">Henüz iletişim formundan mesaj gelmedi.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-100">
                    {s.name}
                    {s.company && <span className="ml-2 text-sm font-normal text-neutral-400">{s.company}</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-400">
                    <a href={`mailto:${s.email}`} className="underline underline-offset-4">
                      {s.email}
                    </a>
                    {s.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">
                          {s.phone}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <time dateTime={s.createdAt.toISOString()} className="text-xs text-neutral-500">
                    {s.createdAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
              </div>

              {s.subject && <p className="mt-3 text-sm font-medium text-neutral-200">{s.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">{s.message}</p>

              <form action={updateContactStatusAction} className="mt-4 flex items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <label htmlFor={`status-${s.id}`} className="sr-only">
                  Durum
                </label>
                <select
                  id={`status-${s.id}`}
                  name="status"
                  defaultValue={s.status}
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
