ALTER TABLE "ProductCategoryTranslation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "ProductCategoryTranslation_locale_slug_key" ON "ProductCategoryTranslation"("locale", "slug");

ALTER TABLE "ProductTranslation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "ProductTranslation_locale_slug_key" ON "ProductTranslation"("locale", "slug");

ALTER TABLE "ProjectTranslation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "ProjectTranslation_locale_slug_key" ON "ProjectTranslation"("locale", "slug");

ALTER TABLE "BlogCategoryTranslation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "BlogCategoryTranslation_locale_slug_key" ON "BlogCategoryTranslation"("locale", "slug");

ALTER TABLE "BlogPostTranslation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "BlogPostTranslation_locale_slug_key" ON "BlogPostTranslation"("locale", "slug");

ALTER TABLE "PageTranslation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "PageTranslation_locale_slug_key" ON "PageTranslation"("locale", "slug");

