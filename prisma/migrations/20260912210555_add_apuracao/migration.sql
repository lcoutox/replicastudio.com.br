-- CreateEnum
CREATE TYPE "TipoFonteApuracao" AS ENUM ('link', 'arquivo', 'nota');

-- CreateEnum
CREATE TYPE "PapelMensagem" AS ENUM ('usuario', 'agente');

-- CreateTable
CREATE TABLE "apuracao" (
    "id" TEXT NOT NULL,
    "pautaId" TEXT NOT NULL,
    "dossie" TEXT NOT NULL DEFAULT '',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fonte_apuracao" (
    "id" TEXT NOT NULL,
    "apuracaoId" TEXT NOT NULL,
    "tipo" "TipoFonteApuracao" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "arquivoUrl" TEXT,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fonte_apuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem_apuracao" (
    "id" TEXT NOT NULL,
    "apuracaoId" TEXT NOT NULL,
    "papel" "PapelMensagem" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagem_apuracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apuracao_pautaId_key" ON "apuracao"("pautaId");

-- CreateIndex
CREATE INDEX "fonte_apuracao_apuracaoId_idx" ON "fonte_apuracao"("apuracaoId");

-- CreateIndex
CREATE INDEX "mensagem_apuracao_apuracaoId_criadoEm_idx" ON "mensagem_apuracao"("apuracaoId", "criadoEm");

-- AddForeignKey
ALTER TABLE "apuracao" ADD CONSTRAINT "apuracao_pautaId_fkey" FOREIGN KEY ("pautaId") REFERENCES "pauta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fonte_apuracao" ADD CONSTRAINT "fonte_apuracao_apuracaoId_fkey" FOREIGN KEY ("apuracaoId") REFERENCES "apuracao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_apuracao" ADD CONSTRAINT "mensagem_apuracao_apuracaoId_fkey" FOREIGN KEY ("apuracaoId") REFERENCES "apuracao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
