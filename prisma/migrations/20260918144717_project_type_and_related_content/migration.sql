-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('REFERENCE', 'CAPACITY_SOLUTION');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "type" "ProjectType" NOT NULL DEFAULT 'REFERENCE';

-- CreateTable
CREATE TABLE "_ProductToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToBlogPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToBlogPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectToBlogPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectToBlogPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductToProject_B_index" ON "_ProductToProject"("B");

-- CreateIndex
CREATE INDEX "_ProductToBlogPost_B_index" ON "_ProductToBlogPost"("B");

-- CreateIndex
CREATE INDEX "_ProjectToBlogPost_B_index" ON "_ProjectToBlogPost"("B");

-- CreateIndex
CREATE INDEX "Project_type_idx" ON "Project"("type");

-- AddForeignKey
ALTER TABLE "_ProductToProject" ADD CONSTRAINT "_ProductToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProject" ADD CONSTRAINT "_ProductToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToBlogPost" ADD CONSTRAINT "_ProductToBlogPost_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToBlogPost" ADD CONSTRAINT "_ProductToBlogPost_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToBlogPost" ADD CONSTRAINT "_ProjectToBlogPost_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToBlogPost" ADD CONSTRAINT "_ProjectToBlogPost_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
