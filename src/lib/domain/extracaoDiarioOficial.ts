import { z } from "zod";

/**
 * Uma edição do Diário Oficial pode conter mais de um ato relevante (um
 * decreto E uma portaria E uma nomeação, por exemplo) — por isso a extração
 * devolve uma lista, não um resumo único da edição inteira. Cada ato
 * extraído aqui vira depois um candidato de pauta independente, classificado
 * pela mesma régua usada pras outras fontes (ver classificacaoPauta.ts).
 */
export const atoExtraidoSchema = z.object({
  titulo: z.string().min(1).max(200),
  resumo: z.string().min(1).max(500),
  // Cópia literal do texto da edição, não paráfrase — é o que a sala de
  // apuração usa como fonte primária. Sem isso só existia resumo-de-resumo
  // (extração + classificação), e o agente na sala não sabia que já
  // tínhamos o texto original em mãos.
  trechoOriginal: z.string().min(1).max(3000),
});

export const extracaoSchema = z.object({ atos: z.array(atoExtraidoSchema) });

export type AtoExtraido = z.infer<typeof atoExtraidoSchema>;

// Editais/decretos longos existem, mas um teto evita que uma edição
// excepcionalmente grande (ex.: consolidação anual) exploda custo/latência
// de um jeito desproporcional ao valor de uma checagem manual.
const LIMITE_CARACTERES_TEXTO = 40_000;

export function montarPromptExtracao(texto: string, edicao: string): string {
  const truncado = texto.length > LIMITE_CARACTERES_TEXTO;
  const corpo = texto.slice(0, LIMITE_CARACTERES_TEXTO);

  return `Você lê o Diário Oficial Eletrônico do Município de Nova Serrana-MG (edição nº ${edicao}) e extrai os atos administrativos distintos publicados nele: decretos, portarias, extratos de contrato/convênio, nomeações, exonerações, editais, licitações, leis. Ignore cabeçalho, sumário, numeração de página e rodapé — não são atos.

Pra cada ato encontrado:
- "titulo": tipo do ato + assunto, curto (ex.: "Portaria nº 123 — nomeação de servidor").
- "resumo": 1-2 frases explicando o que o ato faz, em português, sem jargão de IA.
- "trechoOriginal": trecho **copiado literalmente** do texto da edição (não parafraseado) que fundamenta esse ato — o essencial do ato em si, até uns 3-4 parágrafos. Isso vira a fonte primária consultada depois na apuração, então precisa ser cópia exata, não resumo.

Se a edição não tiver nenhum ato relevante (ex.: errata sem conteúdo novo), devolva uma lista vazia — não invente ato pra preencher.
${truncado ? "\nATENÇÃO: o texto abaixo foi cortado por ser muito longo — extraia só o que está presente, não assuma conteúdo além dele.\n" : ""}
TEXTO DA EDIÇÃO:
${corpo}

Chame a ferramenta "extrair_atos" com a lista de atos encontrados.`;
}

export function validarExtracao(bruto: unknown): AtoExtraido[] {
  return extracaoSchema.parse(bruto).atos;
}
