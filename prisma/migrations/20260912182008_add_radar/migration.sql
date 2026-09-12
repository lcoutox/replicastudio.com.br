-- CreateEnum
CREATE TYPE "EstrategiaFonte" AS ENUM ('api_json', 'manual');

-- CreateEnum
CREATE TYPE "StatusPauta" AS ENUM ('pendente', 'apuracao', 'dispensada');

-- CreateTable
CREATE TABLE "fonte" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "estrategia" "EstrategiaFonte" NOT NULL,
    "urlApi" TEXT,
    "urlPagina" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fonte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pauta" (
    "id" TEXT NOT NULL,
    "fonteId" TEXT NOT NULL,
    "chaveExterna" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT,
    "urlOrigem" TEXT NOT NULL,
    "publicadoEm" TIMESTAMP(3),
    "descobertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPauta" NOT NULL DEFAULT 'pendente',

    CONSTRAINT "pauta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fonte_categoria_key" ON "fonte"("categoria");

-- CreateIndex
CREATE INDEX "pauta_fonteId_status_idx" ON "pauta"("fonteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pauta_fonteId_chaveExterna_key" ON "pauta"("fonteId", "chaveExterna");

-- AddForeignKey
ALTER TABLE "pauta" ADD CONSTRAINT "pauta_fonteId_fkey" FOREIGN KEY ("fonteId") REFERENCES "fonte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
