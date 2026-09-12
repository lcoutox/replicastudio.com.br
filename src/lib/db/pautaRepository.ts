import type { Pauta, StatusPauta, Fonte } from "@prisma/client";
import { prisma } from "./prisma";
import type { CandidatoPauta } from "@/lib/domain/pauta";

export type PautaComFonte = Pauta & { fonte: Fonte };

export type CandidatoParaInserir = CandidatoPauta & {
  pontuacao: number;
  categorias: string[];
  justificativaIA: string;
  status: "pendente" | "dispensada";
  descarteAutomatico: boolean;
};

export async function listarPautas(limite = 200): Promise<PautaComFonte[]> {
  return prisma.pauta.findMany({
    include: { fonte: true },
    orderBy: [{ pontuacao: "desc" }, { descobertoEm: "desc" }],
    take: limite,
  });
}

/**
 * Insere só os candidatos que ainda não existem pra essa fonte — a unicidade
 * (fonteId, chaveExterna) faz o diffing de "já vi isso antes" de graça, sem
 * precisar comparar manualmente contra o que já está salvo. Cada candidato já
 * chega classificado (pontuação, status inicial) — ver src/lib/radar/atualizar.ts.
 */
export async function inserirCandidatosNovos(fonteId: string, candidatos: CandidatoParaInserir[]): Promise<number> {
  if (candidatos.length === 0) return 0;
  const resultado = await prisma.pauta.createMany({
    data: candidatos.map((c) => ({
      fonteId,
      chaveExterna: c.chaveExterna,
      titulo: c.titulo,
      resumo: c.resumo,
      urlOrigem: c.urlOrigem,
      publicadoEm: c.publicadoEm,
      pontuacao: c.pontuacao,
      categorias: c.categorias,
      justificativaIA: c.justificativaIA,
      status: c.status,
      descarteAutomatico: c.descarteAutomatico,
    })),
    skipDuplicates: true,
  });
  return resultado.count;
}

export async function atualizarStatusPauta(id: string, status: StatusPauta): Promise<Pauta> {
  return prisma.pauta.update({ where: { id }, data: { status } });
}

export async function getPautaPorId(id: string): Promise<PautaComFonte | null> {
  return prisma.pauta.findUnique({ where: { id }, include: { fonte: true } });
}

/**
 * Diário Oficial grava um Pauta por ATO (chaveExterna = "{edicao}-{indice}"),
 * não um por edição — então "já vi essa edição" não é mais uma checagem de
 * chave exata, é "existe algum ato gravado com esse prefixo de edição". Vale
 * até pra edição sem nenhum ato relevante: ver marcarEdicaoSemAtos.
 */
export async function edicaoJaProcessada(fonteId: string, edicao: string): Promise<boolean> {
  const existente = await prisma.pauta.findFirst({
    where: { fonteId, chaveExterna: { startsWith: `${edicao}-` } },
    select: { id: true },
  });
  return existente !== null;
}
