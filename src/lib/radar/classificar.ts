import Anthropic from "@anthropic-ai/sdk";
import type { CandidatoPauta } from "@/lib/domain/pauta";
import { montarPromptClassificacao, validarClassificacao, type ClassificacaoPauta, type ContextoClassificacao } from "@/lib/domain/classificacaoPauta";

const MODELO = "claude-haiku-4-5-20251001";

const FERRAMENTA_CLASSIFICAR = {
  name: "classificar_pauta",
  description: "Registra a pontuação e o resumo de um candidato a pauta.",
  input_schema: {
    type: "object" as const,
    properties: {
      pontuacao: { type: "integer", minimum: 0, maximum: 10, description: "Soma da régua, 0 a 10." },
      categorias: { type: "array", items: { type: "string" }, description: "Editorias que o item toca, ex.: [\"saude\"]." },
      resumo: { type: "string", description: "1-2 frases pro card, em português, sem jargão de IA." },
      justificativa: { type: "string", description: "1 frase explicando a pontuação." },
    },
    required: ["pontuacao", "categorias", "resumo", "justificativa"],
  },
};

let cliente: Anthropic | null = null;

function clienteAnthropic(): Anthropic {
  if (cliente) return cliente;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Variável de ambiente ausente: ANTHROPIC_API_KEY");
  cliente = new Anthropic({ apiKey });
  return cliente;
}

/**
 * Classifica um candidato de pauta com Haiku — barato o bastante pra rodar
 * por item numa checagem manual (não é cron, não roda sem você clicar).
 *
 * Usa tool_choice forçado em vez de pedir "responda em JSON" no texto: pedir
 * JSON livre não é confiável (o modelo pode envolver em ```json``` mesmo
 * instruído a não fazer isso — foi exatamente o que quebrou o parsing na
 * primeira tentativa). Com tool use, a API já devolve o objeto estruturado.
 *
 * Uma falha aqui (rede, resposta fora do formato) propaga pro chamador:
 * melhor o item ficar de fora dessa checagem do que entrar sem pontuação.
 */
export async function classificarPauta(candidato: CandidatoPauta, contexto: ContextoClassificacao): Promise<ClassificacaoPauta> {
  const prompt = montarPromptClassificacao(candidato, contexto);

  const resposta = await clienteAnthropic().messages.create({
    model: MODELO,
    max_tokens: 512,
    tools: [FERRAMENTA_CLASSIFICAR],
    tool_choice: { type: "tool", name: "classificar_pauta" },
    messages: [{ role: "user", content: prompt }],
  });

  const bloco = resposta.content.find((b) => b.type === "tool_use");
  if (!bloco || bloco.type !== "tool_use") {
    throw new Error("Resposta de classificação sem chamada de ferramenta.");
  }

  return validarClassificacao(bloco.input);
}
