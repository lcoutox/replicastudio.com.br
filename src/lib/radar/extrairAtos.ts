import { montarPromptExtracao, validarExtracao, type AtoExtraido } from "@/lib/domain/extracaoDiarioOficial";
import { clienteAnthropic, MODELO_HAIKU } from "./clienteAnthropic";

const FERRAMENTA_EXTRAIR = {
  name: "extrair_atos",
  description: "Registra os atos administrativos distintos encontrados na edição do Diário Oficial.",
  input_schema: {
    type: "object" as const,
    properties: {
      atos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            resumo: { type: "string" },
          },
          required: ["titulo", "resumo"],
        },
      },
    },
    required: ["atos"],
  },
};

/**
 * Lê o texto de uma edição e devolve os atos administrativos distintos nela
 * — uma edição pode ter zero, um ou vários. Cada ato vira depois um
 * candidato de pauta independente, classificado por classificarPauta().
 */
export async function extrairAtosDaEdicao(texto: string, edicao: string): Promise<AtoExtraido[]> {
  const prompt = montarPromptExtracao(texto, edicao);

  const resposta = await clienteAnthropic().messages.create({
    model: MODELO_HAIKU,
    max_tokens: 4096,
    tools: [FERRAMENTA_EXTRAIR],
    tool_choice: { type: "tool", name: "extrair_atos" },
    messages: [{ role: "user", content: prompt }],
  });

  const bloco = resposta.content.find((b) => b.type === "tool_use");
  if (!bloco || bloco.type !== "tool_use") {
    throw new Error("Resposta de extração sem chamada de ferramenta.");
  }

  return validarExtracao(bloco.input);
}
