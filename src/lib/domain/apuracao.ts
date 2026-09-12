import { z } from "zod";

/**
 * Fonte anexada na sala de apuração. `tipo` preserva a distinção entre
 * fonte verificável (link, arquivo) e informação solta sem documento
 * formal (nota) — mesma regra do repo `replica`: não publicar fato sem
 * fonte registrada. Ver docs/PRD.md seção 10.
 */
export const novaFonteSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("link"), conteudo: z.string().trim().url("Precisa ser uma URL válida."), descricao: z.string().trim().max(300).optional() }),
  z.object({
    tipo: z.literal("arquivo"),
    nomeArquivo: z.string().trim().min(1),
    conteudoBase64: z.string().min(1).startsWith("data:", "Arquivo precisa ser enviado como data URL."),
    descricao: z.string().trim().max(300).optional(),
  }),
  z.object({ tipo: z.literal("nota"), conteudo: z.string().trim().min(1, "Nota não pode ficar vazia.").max(4000), descricao: z.string().trim().max(300).optional() }),
]);

export type NovaFonte = z.infer<typeof novaFonteSchema>;

export const novaMensagemSchema = z.object({
  conteudo: z.string().trim().min(1, "Mensagem não pode ficar vazia.").max(4000),
});

/**
 * Um bloco de citação da API da Anthropic (web search) — link entre um
 * trecho de texto e a página de onde veio.
 */
export type Citacao = { url: string; titulo: string };

/**
 * A API devolve o texto e as citações em blocos separados. Isso junta num
 * texto só, com uma seção "Fontes citadas" no fim — formato simples o
 * bastante pra guardar como texto puro em MensagemApuracao.conteudo, sem
 * precisar de uma coluna estruturada só pra isso.
 */
export function formatarRespostaComCitacoes(texto: string, citacoes: Citacao[]): string {
  const unicas = Array.from(new Map(citacoes.map((c) => [c.url, c])).values());
  if (unicas.length === 0) return texto.trim();

  const rodape = unicas.map((c, i) => `[${i + 1}] ${c.titulo} — ${c.url}`).join("\n");
  return `${texto.trim()}\n\nFontes citadas:\n${rodape}`;
}
