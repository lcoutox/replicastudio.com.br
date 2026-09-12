import { listarFontesAtivas } from "@/lib/db/fonteRepository";
import { getLinhaEditorialAtiva } from "@/lib/db/brandKitRepository";
import { inserirCandidatosNovos, edicaoJaProcessada, type CandidatoParaInserir } from "@/lib/db/pautaRepository";
import { filtrarRecentes, type CandidatoPauta } from "@/lib/domain/pauta";
import { decidirStatusInicial } from "@/lib/domain/classificacaoPauta";
import { editoriasPrioritarias } from "@/lib/domain/linhaEditorial";
import { buscarCandidatos } from "./fontesRemotas";
import { classificarPauta } from "./classificar";
import { processarDiarioOficial } from "./processarDiarioOficial";

// Radar é sobre o que é novo, não um arquivo histórico — isso existe pra
// evitar que a primeira checagem de uma fonte (ou uma fonte que ficou muito
// tempo sem gente olhar) jogue meses de itens antigos como "pendente" de
// uma vez. Ver docs/PRD.md.
const DIAS_RECENCIA = 21;

// Classificação é por item (chamada de rede) — concorrência limitada evita
// martelar a API e evita a checagem inteira travar numa fila serial de
// dezenas de segundos.
const CONCORRENCIA_CLASSIFICACAO = 4;

export type ResultadoAtualizacao = {
  fonte: string;
  novasPautas: number;
  falhasClassificacao: number;
  erro?: string;
};

async function classificarEmLotes(
  candidatos: CandidatoPauta[],
  contexto: { categoriaFonte: string; editoriasPrioritarias: string[] },
): Promise<{ prontos: CandidatoParaInserir[]; falhas: number }> {
  const prontos: CandidatoParaInserir[] = [];
  let falhas = 0;

  for (let inicio = 0; inicio < candidatos.length; inicio += CONCORRENCIA_CLASSIFICACAO) {
    const lote = candidatos.slice(inicio, inicio + CONCORRENCIA_CLASSIFICACAO);
    const resultados = await Promise.allSettled(lote.map((c) => classificarPauta(c, contexto)));

    resultados.forEach((resultado, i) => {
      const candidato = lote[i]!;
      if (resultado.status === "rejected") {
        falhas += 1;
        console.error(`[radar] falha ao classificar "${candidato.titulo}":`, resultado.reason);
        return;
      }
      const classificacao = resultado.value;
      const { status, descarteAutomatico } = decidirStatusInicial(classificacao.pontuacao);
      prontos.push({
        ...candidato,
        // candidato.resumo é o texto original da API (já limpo de HTML) —
        // guarda antes de sobrescrever com o resumo reescrito pela
        // classificação, senão a sala de apuração não teria fonte primária.
        textoOriginal: candidato.resumo,
        resumo: classificacao.resumo,
        pontuacao: classificacao.pontuacao,
        categorias: classificacao.categorias,
        justificativaIA: classificacao.justificativa,
        status,
        descarteAutomatico,
      });
    });
  }

  return { prontos, falhas };
}

/**
 * Passa por toda fonte ativa com estrategia api_json, busca os itens atuais,
 * classifica cada um (pontuação + resumo via Haiku) e grava só o que ainda
 * não tinha sido visto. Uma fonte falhando (site fora do ar, mudou formato)
 * não derruba a checagem das outras — cada uma reporta seu próprio
 * resultado, inclusive erro, pra ficar visível em vez de silenciosamente
 * sumir do radar.
 */
export async function atualizarRadar(): Promise<ResultadoAtualizacao[]> {
  const [fontes, linhaEditorial] = await Promise.all([listarFontesAtivas(), getLinhaEditorialAtiva()]);
  const resultados: ResultadoAtualizacao[] = [];

  for (const fonte of fontes) {
    if (fonte.estrategia !== "api_json" || !fonte.urlApi) {
      continue;
    }
    try {
      const candidatos = await buscarCandidatos({ urlApi: fonte.urlApi, urlPagina: fonte.urlPagina, categoria: fonte.categoria });
      const recentes = filtrarRecentes(candidatos, new Date(), DIAS_RECENCIA);
      const editorias = editoriasPrioritarias(linhaEditorial, fonte.escopo);

      // Diário Oficial é 1 edição -> 0..N pautas (um ato administrativo pode
      // virar uma pauta cada) — orquestração própria, ver processarDiarioOficial.ts.
      const { prontos, falhas } =
        fonte.categoria === "diario-oficial"
          ? await processarDiarioOficial(recentes, fonte.urlPagina, editorias, (edicao) => edicaoJaProcessada(fonte.id, edicao))
          : await classificarEmLotes(recentes, { categoriaFonte: fonte.categoria, editoriasPrioritarias: editorias });

      const novasPautas = await inserirCandidatosNovos(fonte.id, prontos);
      resultados.push({ fonte: fonte.nome, novasPautas, falhasClassificacao: falhas });
    } catch (erro) {
      resultados.push({
        fonte: fonte.nome,
        novasPautas: 0,
        falhasClassificacao: 0,
        erro: erro instanceof Error ? erro.message : "erro desconhecido",
      });
    }
  }

  return resultados;
}
