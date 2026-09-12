import type { Apuracao, FonteApuracao, MensagemApuracao, PapelMensagem, TipoFonteApuracao } from "@prisma/client";
import { prisma } from "./prisma";

export type ApuracaoCompleta = Apuracao & { fontes: FonteApuracao[]; mensagens: MensagemApuracao[] };

/** Cria a sala se ainda não existir — chamado quando uma Pauta muda pra status "apuracao". */
export async function getOuCriarApuracao(pautaId: string): Promise<Apuracao> {
  const existente = await prisma.apuracao.findUnique({ where: { pautaId } });
  if (existente) return existente;
  return prisma.apuracao.create({ data: { pautaId } });
}

export async function getApuracaoCompleta(pautaId: string): Promise<ApuracaoCompleta | null> {
  return prisma.apuracao.findUnique({
    where: { pautaId },
    include: {
      fontes: { orderBy: { criadoEm: "asc" } },
      mensagens: { orderBy: { criadoEm: "asc" } },
    },
  });
}

export async function adicionarFonte(
  apuracaoId: string,
  dados: { tipo: TipoFonteApuracao; conteudo: string; arquivoUrl?: string; descricao?: string },
): Promise<FonteApuracao> {
  return prisma.fonteApuracao.create({ data: { apuracaoId, ...dados } });
}

export async function removerFonte(fonteId: string): Promise<void> {
  await prisma.fonteApuracao.delete({ where: { id: fonteId } });
}

export async function adicionarMensagem(apuracaoId: string, papel: PapelMensagem, conteudo: string): Promise<MensagemApuracao> {
  return prisma.mensagemApuracao.create({ data: { apuracaoId, papel, conteudo } });
}

export async function atualizarDossie(pautaId: string, dossie: string): Promise<Apuracao> {
  return prisma.apuracao.update({ where: { pautaId }, data: { dossie } });
}
