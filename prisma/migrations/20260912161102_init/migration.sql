-- CreateEnum
CREATE TYPE "FormatoPost" AS ENUM ('foto', 'card');

-- CreateEnum
CREATE TYPE "TemaPost" AS ENUM ('claro', 'escuro');

-- CreateTable
CREATE TABLE "workspace" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_kit" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "corAzul" TEXT NOT NULL,
    "corPreto" TEXT NOT NULL,
    "corBranco" TEXT NOT NULL,
    "corCinza" TEXT NOT NULL,
    "logoPositivoSvg" TEXT NOT NULL,
    "logoNegativoSvg" TEXT NOT NULL,
    "aspaSvg" TEXT NOT NULL,
    "fonteManchetefoto" TEXT NOT NULL,
    "fonteRotulo" TEXT NOT NULL,
    "fonteManchetecard" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_gerado" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "formato" "FormatoPost" NOT NULL,
    "tagOuRotulo" TEXT NOT NULL,
    "manicheteRaw" TEXT NOT NULL,
    "tema" "TemaPost",
    "imagemOrigemUrl" TEXT,
    "imagemResultadoUrl" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_gerado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_kit_workspaceId_key" ON "brand_kit"("workspaceId");

-- CreateIndex
CREATE INDEX "post_gerado_workspaceId_criadoEm_idx" ON "post_gerado"("workspaceId", "criadoEm");

-- AddForeignKey
ALTER TABLE "brand_kit" ADD CONSTRAINT "brand_kit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_gerado" ADD CONSTRAINT "post_gerado_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
