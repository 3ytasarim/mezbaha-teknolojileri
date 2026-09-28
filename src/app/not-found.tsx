import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Sayfa Bulunamadı</h1>
      <p className="mt-4 text-neutral-600">
        Aradığınız sayfa taşınmış veya kaldırılmış olabilir.
      </p>
    </main>
  );
}
