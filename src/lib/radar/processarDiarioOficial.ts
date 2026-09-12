import { decidirStatusInicial } from "@/lib/domain/classificacaoPauta";
import type { CandidatoPauta } from "@/lib/domain/pauta";
import type { CandidatoParaInserir } from "@/lib/db/pautaRepository";
import { baixarPdfEdicao, extrairTextoPdf, mapaEdicaoParaVerId } from "./diarioOficialPdf";
import { extrairAtosDaEdicao } from "./extrairAtos";
import { classificarPauta } from "./classificar";

const CHAVE_SEM_ATOS = "vazio";

/**
 * Uma edição do Diário Oficial pode virar 0, 1 ou N Pautas (uma por ato
 * administrativo distinto encontrado nela) — diferente das outras fontes,
 * que são 1 candidato = 1 Pauta. Por isso tem orquestração própria em vez de
 * reusar classificarEmLotes de atualizar.ts.
 *
 * Edição sem nenhum ato relevante ainda grava um marcador (chaveExterna
 * "{edicao}-vazio", já dispensado) — sem isso, `jaProcessada` nunca veria
 * essa edição como vista, e ela seria baixada e reprocessada em toda
 * checagem futura pra sempre.
 */
export async function processarDiarioOficial(
  edicoesRecentes: CandidatoPauta[],
  urlPagina: string,
  editoriasPrioritariasEscopo: string[],
  jaProcessada: (edicao: string) => Promise<boolean>,
): Promise<{ prontos: CandidatoParaInserir[]; falhas: number }> {
  const prontos: CandidatoParaInserir[] = [];
  let falhas = 0;

  const mapaVerId = await mapaEdicaoParaVerId(urlPagina);

  for (const edicaoCandidata of edicoesRecentes) {
    const edicao = edicaoCandidata.chaveExterna;
    if (await jaProcessada(edicao)) continue;

    const verId = mapaVerId.get(edicao);
    if (!verId) {
      falhas += 1;
      console.error(`[radar] edição ${edicao} do Diário Oficial não encontrada na listagem (possível mudança de página).`);
      continue;
    }

    let atos: Awaited<ReturnType<typeof extrairAtosDaEdicao>>;
    try {
      const pdf = await baixarPdfEdicao(urlPagina, verId);
      const texto = await extrairTextoPdf(pdf);
      atos = await extrairAtosDaEdicao(texto, edicao);
    } catch (erro) {
      falhas += 1;
      console.error(`[radar] falha ao processar edição ${edicao} do Diário Oficial:`, erro);
      continue;
    }

    if (atos.length === 0) {
      prontos.push({
        chaveExterna: `${edicao}-${CHAVE_SEM_ATOS}`,
        titulo: `Diário Oficial nº ${edicao} — sem ato relevante identificado`,
        resumo: null,
        urlOrigem: edicaoCandidata.urlOrigem,
        publicadoEm: edicaoCandidata.publicadoEm,
        pontuacao: 0,
        categorias: [],
        justificativaIA: "Extração não encontrou ato administrativo distinto nessa edição.",
        status: "dispensada",
        descarteAutomatico: true,
        textoOriginal: null,
      });
      continue;
    }

    for (let indice = 0; indice < atos.length; indice++) {
      const ato = atos[indice]!;
      try {
        const classificacao = await classificarPauta(
          { chaveExterna: `${edicao}-${indice}`, titulo: ato.titulo, resumo: ato.resumo, urlOrigem: edicaoCandidata.urlOrigem, publicadoEm: edicaoCandidata.publicadoEm },
          { categoriaFonte: "diario-oficial", editoriasPrioritarias: editoriasPrioritariasEscopo },
        );
        const { status, descarteAutomatico } = decidirStatusInicial(classificacao.pontuacao);
        prontos.push({
          chaveExterna: `${edicao}-${indice}`,
          titulo: `Diário Oficial nº ${edicao} — ${ato.titulo}`,
          resumo: classificacao.resumo,
          urlOrigem: edicaoCandidata.urlOrigem,
          publicadoEm: edicaoCandidata.publicadoEm,
          pontuacao: classificacao.pontuacao,
          categorias: classificacao.categorias,
          justificativaIA: classificacao.justificativa,
          status,
          descarteAutomatico,
          textoOriginal: ato.trechoOriginal,
        });
      } catch (erro) {
        falhas += 1;
        console.error(`[radar] falha ao classificar ato "${ato.titulo}" da edição ${edicao}:`, erro);
      }
    }
  }

  return { prontos, falhas };
}
