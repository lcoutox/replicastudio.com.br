/**
 * Interpreta a sintaxe **trecho** usada nas manchetes pra marcar o grifo azul.
 * Função pura e reutilizável: tanto o template "foto" (Satori) quanto uma futura
 * pré-visualização em HTML puro podem consumir o mesmo resultado.
 */

export type TextoSegmento = {
  texto: string;
  destaque: boolean;
};

const PADRAO_DESTAQUE = /\*\*(.*?)\*\*/g;

/**
 * Quebra o texto em segmentos alternando trechos normais e destacados.
 * "Prefeitura contrata **Pocah**" ->
 *   [{texto: "Prefeitura contrata ", destaque: false}, {texto: "Pocah", destaque: true}]
 */
export function analisarDestaque(bruto: string): TextoSegmento[] {
  const segmentos: TextoSegmento[] = [];
  let ultimoIndice = 0;

  for (const match of bruto.matchAll(PADRAO_DESTAQUE)) {
    const inicio = match.index ?? 0;
    if (inicio > ultimoIndice) {
      segmentos.push({ texto: bruto.slice(ultimoIndice, inicio), destaque: false });
    }
    segmentos.push({ texto: match[1] ?? "", destaque: true });
    ultimoIndice = inicio + match[0].length;
  }

  if (ultimoIndice < bruto.length) {
    segmentos.push({ texto: bruto.slice(ultimoIndice), destaque: false });
  }

  return segmentos.filter((s) => s.texto.length > 0);
}

/** Quantos trechos destacados existem no texto. Útil pra avisar o usuário se passar de um. */
export function contarDestaques(bruto: string): number {
  return (bruto.match(PADRAO_DESTAQUE) ?? []).length;
}

/** Remove a marcação **...** deixando só o texto puro (usado no resumo/legenda). */
export function textoSemMarcacao(bruto: string): string {
  return bruto.replace(PADRAO_DESTAQUE, "$1");
}
