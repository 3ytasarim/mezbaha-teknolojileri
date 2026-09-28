export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">{title}</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Bu bölüm sonraki geliştirme fazında (CMS/CRUD implementasyonu) hayata geçirilecek.
        Şu an foundation aşamasında yalnızca kimlik doğrulama ve gezinme iskeleti hazır.
      </p>
    </div>
  );
}
