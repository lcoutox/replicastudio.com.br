import Anthropic from "@anthropic-ai/sdk";

export const MODELO_HAIKU = "claude-haiku-4-5-20251001";

let cliente: Anthropic | null = null;

export function clienteAnthropic(): Anthropic {
  if (cliente) return cliente;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Variável de ambiente ausente: ANTHROPIC_API_KEY");
  cliente = new Anthropic({ apiKey });
  return cliente;
}
