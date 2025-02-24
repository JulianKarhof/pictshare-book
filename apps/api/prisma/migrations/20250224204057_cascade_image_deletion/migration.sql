-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_elementId_fkey";

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE CASCADE ON UPDATE CASCADE;
