"use client";

import { useActionState } from "react";
import { FormField, inputClass, textareaClass, selectClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaPicker } from "@/components/admin/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MultiSelectList } from "@/components/admin/multi-select-list";
import type { BlogPostFormState } from "./actions";

type CategoryOption = { id: string; name: string };
type RelatedOption = { id: string; label: string };

export type BlogPostFormValues = {
  title: string;
  slug: string;
  categoryId: string;
  tags: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  relatedProductIds: string[];
  relatedProjectIds: string[];
};

export function BlogPostForm({
  action,
  initialValues,
  categories,
  productOptions,
  projectOptions,
}: {
  action: (state: BlogPostFormState, formData: FormData) => Promise<BlogPostFormState>;
  initialValues?: BlogPostFormValues;
  categories: CategoryOption[];
  productOptions: RelatedOption[];
  projectOptions: RelatedOption[];
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Genel</h2>

        <FormField label="Başlık" htmlFor="title">
          <input id="title" name="title" defaultValue={initialValues?.title} required className={inputClass} />
        </FormField>

        <FormField label="Slug" htmlFor="slug" hint="Boş bırakılırsa başlıktan otomatik üretilir.">
          <input id="slug" name="slug" defaultValue={initialValues?.slug} className={inputClass} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kategori" htmlFor="categoryId">
            <select id="categoryId" name="categoryId" defaultValue={initialValues?.categoryId} className={selectClass}>
              <option value="">Kategorisiz</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Yazar" htmlFor="authorName" hint="Boş bırakılırsa şirket adı kullanılır.">
            <input id="authorName" name="authorName" defaultValue={initialValues?.authorName} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Etiketler (zorunlu)" htmlFor="tags" hint="En az bir etiket. Virgülle ayırın, Türkçe karakter kullanın, örn. İkizray, Raylı Taşıma Sistemleri, Et Kalitesi. Yazıyla ilgili 3–5 etiket önerilir.">
          <input id="tags" name="tags" required defaultValue={initialValues?.tags} placeholder="İkizray, Karkas Taşıma, Et Kalitesi" className={inputClass} />
        </FormField>

        <FormField label="Özet" htmlFor="excerpt">
          <textarea
            id="excerpt"
            name="excerpt"
            defaultValue={initialValues?.excerpt}
            rows={2}
            className={textareaClass}
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-neutral-200">İçerik</p>
          <RichTextEditor name="content" initialValue={initialValues?.content} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Durum" htmlFor="status">
            <select id="status" name="status" defaultValue={initialValues?.status ?? "DRAFT"} className={selectClass}>
              <option value="DRAFT">Taslak</option>
              <option value="PUBLISHED">Yayında</option>
              <option value="ARCHIVED">Arşivlendi</option>
            </select>
          </FormField>
          <FormField label="Yayın Tarihi" htmlFor="publishedAt">
            <input
              id="publishedAt"
              name="publishedAt"
              type="date"
              defaultValue={initialValues?.publishedAt}
              className={inputClass}
            />
          </FormField>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input type="checkbox" name="featured" defaultChecked={initialValues?.featured} className="h-4 w-4" />
              Öne Çıkan
            </label>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Medya</h2>
        <MediaPicker name="coverImage" label="Kapak Görseli" initialUrl={initialValues?.coverImage} altName="coverImageAlt" initialAlt={initialValues?.coverImageAlt} />
      </section>

      <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">SEO</h2>
        <FormField label="SEO Başlığı" htmlFor="seoTitle">
          <input id="seoTitle" name="seoTitle" defaultValue={initialValues?.seoTitle} className={inputClass} />
        </FormField>
        <FormField label="SEO Açıklaması" htmlFor="seoDescription">
          <textarea
            id="seoDescription"
            name="seoDescription"
            defaultValue={initialValues?.seoDescription}
            rows={2}
            className={textareaClass}
          />
        </FormField>
        <FormField label="Canonical URL (opsiyonel)" htmlFor="canonicalUrl">
          <input id="canonicalUrl" name="canonicalUrl" defaultValue={initialValues?.canonicalUrl} className={inputClass} />
        </FormField>
        <MediaPicker name="ogImage" label="OG Görseli (opsiyonel)" initialUrl={initialValues?.ogImage} />
      </section>

      <section className="flex flex-col gap-6 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">İlgili İçerik</h2>
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-200">İlgili Ürünler</p>
          <MultiSelectList
            name="relatedProductIds"
            options={productOptions}
            initialSelectedIds={initialValues?.relatedProductIds ?? []}
            emptyLabel="Henüz ürün yok."
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-200">İlgili Projeler</p>
          <MultiSelectList
            name="relatedProjectIds"
            options={projectOptions}
            initialSelectedIds={initialValues?.relatedProjectIds ?? []}
            emptyLabel="Henüz proje yok."
          />
        </div>
      </section>

      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <SubmitButton label="Kaydet" />
      </div>
    </form>
  );
}
