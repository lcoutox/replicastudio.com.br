import { z } from "zod";
import { contarDestaques } from "./highlightedText";

const MAX_DESTAQUES = 1;

const tamanhoSchema = z.enum(["feed", "stories"]);

const campoFoto = z.object({
  tipo: z.literal("foto"),
  tamanho: tamanhoSchema,
  tag: z.string().trim().min(1, "Chamada não pode ficar vazia.").max(80),
  manicheteRaw: z
    .string()
    .trim()
    .min(1, "Manchete não pode ficar vazia.")
    .max(220)
    .refine((valor) => contarDestaques(valor) <= MAX_DESTAQUES, {
      message: `Use no máximo ${MAX_DESTAQUES} trecho em destaque (**assim**).`,
    }),
  imagemFundoDataUrl: z
    .string()
    .startsWith("data:image/", "A imagem de fundo precisa ser enviada como data URL."),
});

const campoCard = z.object({
  tipo: z.literal("card"),
  tamanho: tamanhoSchema,
  rotulo: z.string().trim().min(1, "Rótulo não pode ficar vazio.").max(60),
  manchete: z.string().trim().min(1, "Manchete não pode ficar vazia.").max(160),
  tema: z.enum(["claro", "escuro"]),
});

/**
 * Validação do corpo de POST /api/gerar e /api/preview. Fica em `domain`
 * (não em `app/api`) de propósito: é lógica de negócio pura, testável sem
 * subir o Next.js.
 */
export const pedidoGeracaoSchema = z.discriminatedUnion("tipo", [campoFoto, campoCard]);

export type PedidoGeracao = z.infer<typeof pedidoGeracaoSchema>;
