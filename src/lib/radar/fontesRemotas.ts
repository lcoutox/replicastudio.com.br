import { candidatosDiarioOficial, candidatosLicitacoes, type CandidatoPauta } from "@/lib/domain/pauta";

// Portal da prefeitura bloqueia fetch sem User-Agent de navegador (ver
// monitoramento/fontes.yaml no repo `replica`) — mesmo problema documentado
// pra outras fontes (imprensa regional).
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function buscarJson<T>(url: string): Promise<T> {
  const resposta = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resposta.ok) throw new Error(`Falha ao buscar ${url}: HTTP ${resposta.status}`);
  return resposta.json() as Promise<T>;
}

/**
 * Busca os candidatos de pauta de uma Fonte com estrategia api_json. Único
 * ponto de I/O de rede do radar — mapeamento pra CandidatoPauta é sempre
 * puro (src/lib/domain/pauta.ts), testável sem rede.
 *
 * `categoria` decide o parser porque cada dataset de dados-abertos da
 * prefeitura tem um formato de campos diferente (edição vs. processo
 * licitatório) — não existe um shape único entre eles.
 */
export async function buscarCandidatos(fonte: { urlApi: string; urlPagina: string; categoria: string }): Promise<CandidatoPauta[]> {
  const dados = await buscarJson<{ dados: unknown[] }>(fonte.urlApi);

  switch (fonte.categoria) {
    case "diario-oficial":
      return candidatosDiarioOficial(dados.dados as Parameters<typeof candidatosDiarioOficial>[0], fonte.urlPagina);
    case "licitacoes":
      return candidatosLicitacoes(dados.dados as Parameters<typeof candidatosLicitacoes>[0], fonte.urlPagina);
    default:
      throw new Error(`Categoria de fonte sem parser: ${fonte.categoria}`);
  }
}
