import { z } from "zod";

/**
 * Foco editorial por abrangência — o que a redação realmente cobre, não
 * "notícia em tese pra qualquer veículo". Guardado como JSON em
 * Workspace.linhaEditorial; esse schema é a fonte da verdade do formato.
 */
export const focoEscopoSchema = z.object({
  escopo: z.string().min(1),
  editoriasPrioritarias: z.array(z.string().min(1)).min(1),
});

export const linhaEditorialSchema = z.array(focoEscopoSchema);

export type FocoEscopo = z.infer<typeof focoEscopoSchema>;
export type LinhaEditorial = z.infer<typeof linhaEditorialSchema>;

/** Editorias prioritárias pro escopo de uma fonte — [] se o escopo não foi declarado (fica sem sinal editorial, não quebra). */
export function editoriasPrioritarias(linha: LinhaEditorial, escopo: string): string[] {
  return linha.find((foco) => foco.escopo === escopo)?.editoriasPrioritarias ?? [];
}
