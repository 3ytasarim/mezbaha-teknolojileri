"use client";

import { useActionState } from "react";
import { FormField, inputClass, textareaClass, selectClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaPicker } from "@/components/admin/media-picker";
import { GalleryEditor, type GalleryItem } from "@/components/admin/gallery-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MultiSelectList } from "@/components/admin/multi-select-list";
import type { ProjectFormState } from "./actions";

type RelatedOption = { id: string; label: string };

export type ProjectFormValues = {
  name: string;
  slug: string;
  type: "REFERENCE" | "CAPACITY_SOLUTION";
  country: string;
  city: string;
  capacity: string;
  area: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  coverImageAlt: string;
  videoUrl: string;
  sortOrder: number;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  gallery: GalleryItem[];
  relatedProductIds: string[];
  relatedPostIds: string[];
};

export function ProjectForm({
  action,
  initialValues,
  productOptions,
  postOptions,
}: {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  initialValues?: ProjectFormValues;
  productOptions: RelatedOption[];
  postOptions: RelatedOption[];
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Genel</h2>

        <FormField label="Proje Adı" htmlFor="name">
          <input id="name" name="name" defaultValue={initialValues?.name} required className={inputClass} />
        </FormField>

        <FormField label="Slug" htmlFor="slug" hint="Boş bırakılırsa isimden otomatik üretilir.">
          <input id="slug" name="slug" defaultValue={initialValues?.slug} className={inputClass} />
        </FormField>

        <FormField
          label="Tür"
          htmlFor="type"
          hint="Referans Proje: gerçekleştirilmiş bir saha projesi. Kapasite Paketi: C-50 gibi hazır tesis paketi."
        >
          <select id="type" name="type" defaultValue={initialValues?.type ?? "REFERENCE"} className={selectClass}>
            <option value="REFERENCE">Referans Proje</option>
            <option value="CAPACITY_SOLUTION">Kapasite Paketi</option>
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ülke" htmlFor="country">
            <input id="country" name="country" defaultValue={initialValues?.country} required className={inputClass} />
          </FormField>
          <FormField label="Şehir" htmlFor="city">
            <input id="city" name="city" defaultValue={initialValues?.city} className={inputClass} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kapasite" htmlFor="capacity" hint="Örn. 50 büyükbaş + 100 koyun">
            <input id="capacity" name="capacity" defaultValue={initialValues?.capacity} className={inputClass} />
          </FormField>
          <FormField label="Alan" htmlFor="area" hint="Örn. ~350 m²">
            <input id="area" name="area" defaultValue={initialValues?.area} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Kısa Açıklama" htmlFor="shortDescription">
          <textarea
            id="shortDescription"
            name="shortDescription"
            defaultValue={initialValues?.shortDescription}
            rows={2}
            className={textareaClass}
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-neutral-200">Açıklama</p>
          <RichTextEditor name="description" initialValue={initialValues?.description} />
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

        <FormField
          label="Sıra"
          htmlFor="sortOrder"
          hint="Kapasite paketlerinin görüntülenme sırasını belirler (küçükten büyüğe)."
        >
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={initialValues?.sortOrder ?? 0}
            className={inputClass}
          />
        </FormField>
      </section>

      <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Medya</h2>
        <MediaPicker name="coverImage" label="Kapak Görseli" initialUrl={initialValues?.coverImage} altName="coverImageAlt" initialAlt={initialValues?.coverImageAlt} />
        <FormField label="Video URL" htmlFor="videoUrl">
          <input id="videoUrl" name="videoUrl" defaultValue={initialValues?.videoUrl} className={inputClass} />
        </FormField>
        <p className="text-sm font-medium text-neutral-200">Galeri</p>
        <GalleryEditor name="gallery" initialItems={initialValues?.gallery ?? []} />
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
          <p className="mb-2 text-sm font-medium text-neutral-200">İlgili Makaleler</p>
          <MultiSelectList
            name="relatedPostIds"
            options={postOptions}
            initialSelectedIds={initialValues?.relatedPostIds ?? []}
            emptyLabel="Henüz blog yazısı yok."
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
