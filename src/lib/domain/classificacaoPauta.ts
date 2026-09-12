import { z } from "zod";
import type { CandidatoPauta } from "./pauta";

/**
 * Régua de pontuação de pauta — 4 critérios, 0-10 total. Não é "isso é
 * notícia em tese", é "isso é notícia PRA ESSA REDAÇÃO", por isso o
 * alinhamento editorial pesa tanto quanto os outros três juntos.
 *
 *   Alinhamento com o foco editorial   0-3
 *   Impacto direto no cidadão          0-2
 *   Transparência da contratação       0-2  (Dispensa/Inexigibilidade pontua mais)
 *   Sinal de contradição/controvérsia  0-3
 *
 * Rodada por Haiku (barato, texto curto, critério objetivo — não precisa de
 * um modelo mais caro). Resultado é heurística de priorização, não filtro
 * infalível: por isso nada é apagado, só marcado como descarte automático
 * (Pauta.descarteAutomatico) e continua auditável.
 */
export const LIMIAR_PENDENTE = 5;

export const classificacaoSchema = z.object({
  pontuacao: z.number().int().min(0).max(10),
  categorias: z.array(z.string().min(1)).default([]),
  resumo: z.string().min(1).max(400),
  justificativa: z.string().min(1).max(300),
});

export type ClassificacaoPauta = z.infer<typeof classificacaoSchema>;

export type ContextoClassificacao = {
  categoriaFonte: string;
  editoriasPrioritarias: string[];
};

/**
 * Valida o input já estruturado que a API devolve via tool use — nunca
 * confia no shape sem checar, mesmo vindo de uma chamada com schema forçado.
 * Não faz JSON.parse: pedir output livre em texto ("responda só com JSON")
 * não é confiável, o modelo pode envolver em ```json``` mesmo instruído a não
 * fazer isso — por isso o schema é forçado via tool_choice na chamada
 * (src/lib/radar/classificar.ts), que já devolve objeto, não string.
 */
export function validarClassificacao(bruto: unknown): ClassificacaoPauta {
  return classificacaoSchema.parse(bruto);
}

export function montarPromptClassificacao(candidato: CandidatoPauta, contexto: ContextoClassificacao): string {
  const foco =
    contexto.editoriasPrioritarias.length > 0
      ? contexto.editoriasPrioritarias.join(", ")
      : "(nenhum foco editorial declarado pra esse escopo — pontue só pelos outros critérios)";

  return `Você avalia candidatos a pauta pra uma redação local (Réplica, Nova Serrana-MG). Aplique a régua abaixo.

RÉGUA (soma 0 a 10):
1. Alinhamento com o foco editorial (0-3): a redação prioriza estas editorias pra esse escopo: ${foco}. Pontue alto se o assunto se encaixa numa delas; 0 se for tema fora do foco (ex.: esporte, se não estiver na lista), mesmo que seja "notícia" em tese.
2. Impacto direto no cidadão (0-2): serviço público, saúde, educação, saneamento, segurança, mobilidade = alto. Rotina administrativa interna (material de escritório, manutenção de veículo, expediente) = 0.
3. Transparência da contratação (0-2): contratação por Dispensa ou Inexigibilidade (pulou disputa competitiva) = 2. Pregão/Concorrência = 0-1. Se não se aplica (ex.: Diário Oficial), pontue 1.
4. Sinal de contradição ou controvérsia (0-3): linguagem desproporcional ao valor/tema, contradição com discurso público anterior, fornecedor ou tema incomum pro contexto (ex.: contrato de artista durante anúncio de contenção de gastos) = alto. Ausência de qualquer sinal = 0.

Exemplos de calibração (não são o item atual, só a régua em ação):
- "Prefeitura contrata cantora por R$ 80 mil dias após anunciar contenção de gastos" → 9 (contradição explícita + transparência baixa se foi Dispensa + alto impacto se envolve dinheiro público relevante).
- "Aquisição de utensílios domésticos de copa e cozinha pra secretarias" → 1 (rotina administrativa, sem sinal de controvérsia, baixo impacto direto).
- "Decreto autoriza contenção de gastos em secretarias municipais" → 6 (alto impacto/política pública, mas sem controvérsia por si só).

ITEM A AVALIAR:
Fonte: ${contexto.categoriaFonte}
Título: ${candidato.titulo}
Descrição: ${candidato.resumo ?? "(sem descrição disponível)"}

Chame a ferramenta "classificar_pauta" com o resultado. O campo "resumo" é o texto que aparece no card pro jornalista — 1-2 frases, em português, sem jargão de IA.`;
}

export function decidirStatusInicial(pontuacao: number): { status: "pendente" | "dispensada"; descarteAutomatico: boolean } {
  if (pontuacao >= LIMIAR_PENDENTE) return { status: "pendente", descarteAutomatico: false };
  return { status: "dispensada", descarteAutomatico: true };
}
