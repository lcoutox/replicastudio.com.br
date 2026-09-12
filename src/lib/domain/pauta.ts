/**
 * Mapeamento puro dos formatos de dados abertos da prefeitura pra um
 * "candidato de pauta" genérico — sem I/O aqui, só a lógica de transformar
 * JSON bruto em algo que o resto do radar entende. O fetch de verdade fica em
 * src/lib/radar/*, que chama essas funções.
 */

export type CandidatoPauta = {
  chaveExterna: string;
  titulo: string;
  resumo: string | null;
  urlOrigem: string;
  publicadoEm: Date | null;
};

type ItemDiarioOficial = {
  edicao: string;
  data: string;
  dataAtualizacao: string;
  edicaoExtra?: string | null;
  descricao?: string | null;
};

type ItemLicitacao = {
  numeroProcesso: number;
  numeroEdital: number;
  titulo: string;
  descricao?: string | null;
  modalidade: string;
  situacao: string;
  dataAtualizacao: string;
};

/** Remove entidades HTML e tags simples — os campos de descrição da API vêm com isso. */
export function limparHtml(bruto: string): string {
  return bruto
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&atilde;/g, "ã")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ccedil;/g, "ç")
    .replace(/&Ccedil;/g, "Ç")
    .replace(/&Atilde;/g, "Ã")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&ordm;/g, "º")
    .replace(/&ordf;/g, "ª")
    .replace(/\s+/g, " ")
    .trim();
}

function dataOuNula(valor: string | undefined | null): Date | null {
  if (!valor) return null;
  const data = new Date(valor.replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * O endpoint de dados abertos do Diário Oficial só traz metadados de edição
 * (número, data, se é extra) — nunca o conteúdo. Sem sumário na origem, o
 * candidato aponta pra página de busca com o número da edição; abrir o PDF
 * em si é passo manual até existir extração de texto (ver docs/PRD.md).
 */
export function candidatosDiarioOficial(itens: ItemDiarioOficial[], urlPagina: string): CandidatoPauta[] {
  return itens.map((item) => ({
    chaveExterna: item.edicao,
    titulo: `Diário Oficial nº ${item.edicao}${item.edicaoExtra === "S" ? " (edição extra)" : ""}`,
    resumo: item.descricao?.trim()
      ? limparHtml(item.descricao)
      : "Sem resumo automático ainda — busque pelo número da edição na página do Diário Oficial.",
    urlOrigem: urlPagina,
    publicadoEm: dataOuNula(item.data),
  }));
}

/**
 * Sem isso, a primeira checagem de uma fonte nova trata todo o histórico
 * (às vezes desde janeiro) como "pendente" de uma vez só — inundando o radar
 * em vez de mostrar só o que é genuinamente recente. Item sem data (parse
 * falhou) fica de fora do corte, melhor mostrar do que esconder por engano.
 */
export function filtrarRecentes(candidatos: CandidatoPauta[], agora: Date, diasLimite: number): CandidatoPauta[] {
  const corte = agora.getTime() - diasLimite * 24 * 60 * 60 * 1000;
  return candidatos.filter((c) => c.publicadoEm === null || c.publicadoEm.getTime() >= corte);
}

/**
 * Licitações já vêm com título e descrição prontos na API — diferente do
 * Diário Oficial, dá pra montar um resumo de verdade sem abrir nada.
 */
export function candidatosLicitacoes(itens: ItemLicitacao[], urlPagina: string): CandidatoPauta[] {
  return itens.map((item) => ({
    chaveExterna: String(item.numeroProcesso),
    titulo: `${item.modalidade} — ${limparHtml(item.titulo).slice(0, 140)}`,
    resumo: item.descricao ? `${limparHtml(item.descricao)} (situação: ${item.situacao})` : `Situação: ${item.situacao}`,
    urlOrigem: urlPagina,
    publicadoEm: dataOuNula(item.dataAtualizacao),
  }));
}
