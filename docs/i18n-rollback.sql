-- Geri alma (yalnızca kolon/indeks kaldırır; slug verileri kaybolur). Kullanım: yalnızca i18n çalışması geri alınacaksa.
DROP INDEX IF EXISTS "ProductCategoryTranslation_locale_slug_key";
ALTER TABLE "ProductCategoryTranslation" DROP COLUMN IF EXISTS "slug";
DROP INDEX IF EXISTS "ProductTranslation_locale_slug_key";
ALTER TABLE "ProductTranslation" DROP COLUMN IF EXISTS "slug";
DROP INDEX IF EXISTS "ProjectTranslation_locale_slug_key";
ALTER TABLE "ProjectTranslation" DROP COLUMN IF EXISTS "slug";
DROP INDEX IF EXISTS "BlogCategoryTranslation_locale_slug_key";
ALTER TABLE "BlogCategoryTranslation" DROP COLUMN IF EXISTS "slug";
DROP INDEX IF EXISTS "BlogPostTranslation_locale_slug_key";
ALTER TABLE "BlogPostTranslation" DROP COLUMN IF EXISTS "slug";
DROP INDEX IF EXISTS "PageTranslation_locale_slug_key";
ALTER TABLE "PageTranslation" DROP COLUMN IF EXISTS "slug";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260926120000_translation_slug';
