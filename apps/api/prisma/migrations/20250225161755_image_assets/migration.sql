/*
  Warnings:

  - You are about to drop the column `url` on the `Image` table. All the data in the column will be lost.
  - This will delete all image elements. This is fine because currently images are just placeholders.
  - A unique constraint covering the columns `[key]` on the table `ImageAsset` will be added. If there are existing duplicate values, this will fail.

*/

-- Delete all image elements
DELETE FROM "Image";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "url",
ADD COLUMN     "assetId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "orientation" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploaderId" TEXT,

    CONSTRAINT "ImageAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImageAsset_projectId_idx" ON "ImageAsset"("projectId");

-- CreateIndex
CREATE INDEX "ImageAsset_uploaderId_idx" ON "ImageAsset"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageAsset_key_key" ON "ImageAsset"("key");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "ImageAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
