-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('IMAGE', 'TEXT', 'SHAPE');

-- CreateEnum
CREATE TYPE "ShapeType" AS ENUM ('RECTANGLE', 'CIRCLE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Element" (
    "id" TEXT NOT NULL,
    "type" "ElementType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "scaleX" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "scaleY" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "angle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Text" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "fontFamily" TEXT,
    "color" INTEGER,
    "elementId" TEXT NOT NULL,

    CONSTRAINT "Text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shape" (
    "id" TEXT NOT NULL,
    "shapeType" "ShapeType" NOT NULL,
    "fill" INTEGER,
    "stroke" INTEGER,
    "strokeWidth" DOUBLE PRECISION,
    "points" DOUBLE PRECISION[],
    "elementId" TEXT NOT NULL,

    CONSTRAINT "Shape_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Element_zIndex_idx" ON "Element"("zIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Element_id_type_key" ON "Element"("id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Image_elementId_key" ON "Image"("elementId");

-- CreateIndex
CREATE INDEX "Image_elementId_idx" ON "Image"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "Text_elementId_key" ON "Text"("elementId");

-- CreateIndex
CREATE INDEX "Text_elementId_idx" ON "Text"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "Shape_elementId_key" ON "Shape"("elementId");

-- CreateIndex
CREATE INDEX "Shape_elementId_idx" ON "Shape"("elementId");

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Text" ADD CONSTRAINT "Text_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shape" ADD CONSTRAINT "Shape_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
