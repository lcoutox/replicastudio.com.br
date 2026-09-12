/*
  Warnings:

  - Added the required column `escopo` to the `fonte` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fonte" ADD COLUMN     "escopo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "pauta" ADD COLUMN     "categorias" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "descarteAutomatico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "justificativaIA" TEXT,
ADD COLUMN     "pontuacao" INTEGER;

-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "linhaEditorial" JSONB;
