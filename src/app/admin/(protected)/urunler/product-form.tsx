"use client";

import { useActionState } from "react";
import { FormField, inputClass, textareaClass, selectClass } from "@/components/admin/form-field";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaPicker } from "@/components/admin/media-picker";
import { GalleryEditor, type GalleryItem } from "@/components/admin/gallery-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SpecsEditor, type SpecItem } from "@/components/admin/specs-editor";
import { DocumentsEditor, type DocumentItem } from "@/components/admin/documents-editor";
import { MultiSelectList } from "@/components/admin/multi-select-list";
import { LocaleImageEditor, type LocaleImageOption, type LocaleImageValues } from "@/components/admin/locale-image-editor";
import type { ProductFormState } from "./actions";

type CategoryOption = { id: string; name: string };
type RelatedOption = { id: string; label: string };

export type ProductFormValues = {
  name: string;
  slug: string;
  categoryId: string;
  sku: string;
  shortDescription: string;
  description: string;
  applications: string;
  features: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  active: boolean;
  sortOrder: number;
  coverImage: string;
  coverImageAlt: string;
  videoUrl: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  gallery: GalleryItem[];
  specifications: SpecItem[];
  documents: DocumentItem[];
  relatedProjectIds: string[];
  relatedPostIds: string[];
};

export function ProductForm({
  action,
  initialValues,
  categories,
  projectOptions,
  postOptions,
  localeImageOptions,
  localeImageValues,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initialValues?: ProductFormValues;
  categories: CategoryOption[];
  projectOptions: RelatedOption[];
  postOptions: RelatedOption[];
  /** Yalnızca düzenleme modunda (mevcut ürün) verilir — yeni ürünlerde henüz çeviri olmadığı için gösterilmez. */
  localeImageOptions?: LocaleImageOption[];
  localeImageValues?: Partial<Record<string, LocaleImageValues>>;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Genel</h2>

        <FormField label="Ürün Adı" htmlFor="name">
          <input id="name" name="name" defaultValue={initialValues?.name} required className={inputClass} />
        </FormField>

        <FormField label="Slug" htmlFor="slug" hint="Boş bırakılırsa isimden otomatik üretilir.">
          <input id="slug" name="slug" defaultValue={initialValues?.slug} className={inputClass} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kategori" htmlFor="categoryId">
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={initialValues?.categoryId}
              required
              className={selectClass}
            >
              <option value="">Seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="SKU" htmlFor="sku">
            <input id="sku" name="sku" defaultValue={initialValues?.sku} className={inputClass} />
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

          <FormField label="Sıra" htmlFor="sortOrder">
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={initialValues?.sortOrder ?? 0}
              className={inputClass}
            />
          </FormField>

          <div className="flex flex-col justify-end gap-2 pb-2">
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input type="checkbox" name="featured" defaultChecked={initialValues?.featured} className="h-4 w-4" />
              Öne Çıkan
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initialValues?.active ?? true}
                className="h-4 w-4"
              />
              Aktif
            </label>
          </div>
        </div>
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

      {localeImageOptions && (
        <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Dile Özgü Görseller</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Kapak/galeri görsellerinin üzerinde yazı varsa, her dil için ayrı görsel buradan yüklenir. Boş bırakılan
              diller yukarıdaki ortak görseli kullanmaya devam eder.
            </p>
          </div>
          <LocaleImageEditor
            locales={localeImageOptions}
            baseGallery={(initialValues?.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt }))}
            initialValues={localeImageValues ?? {}}
          />
        </section>
      )}

      <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Teknik Özellikler
        </h2>
        <SpecsEditor name="specifications" initialItems={initialValues?.specifications ?? []} />
      </section>

      <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Kullanım Alanları / Özellikler
        </h2>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-neutral-200">Kullanım Alanları</p>
          <RichTextEditor name="applications" initialValue={initialValues?.applications} />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-neutral-200">Öne Çıkan Özellikler</p>
          <RichTextEditor name="features" initialValue={initialValues?.features} />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-neutral-800 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Belgeler</h2>
        <DocumentsEditor name="documents" initialItems={initialValues?.documents ?? []} />
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
          <p className="mb-2 text-sm font-medium text-neutral-200">İlgili Projeler</p>
          <MultiSelectList
            name="relatedProjectIds"
            options={projectOptions}
            initialSelectedIds={initialValues?.relatedProjectIds ?? []}
            emptyLabel="Henüz proje yok."
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
