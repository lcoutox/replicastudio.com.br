import type { PostGerado, Tamanho as TamanhoDb, TemaPost, TipoTemplate } from "@prisma/client";
import { prisma } from "./prisma";

export type NovoPostGerado = {
  workspaceId: string;
  tipo: TipoTemplate;
  tamanho: TamanhoDb;
  tagOuRotulo: string;
  manicheteRaw: string;
  tema?: TemaPost;
  imagemOrigemUrl?: string;
  imagemResultadoUrl: string;
};

/**
 * Isola o acesso a dados de PostGerado atrás de funções simples. Os route
 * handlers dependem desta interface, não do Prisma diretamente — troca de
 * client de banco ou mock em teste não deveriam vazar pra camada de API.
 */
export async function criarPost(dados: NovoPostGerado): Promise<PostGerado> {
  return prisma.postGerado.create({ data: dados });
}

export async function listarPosts(workspaceId: string, limite = 50): Promise<PostGerado[]> {
  return prisma.postGerado.findMany({
    where: { workspaceId },
    orderBy: { criadoEm: "desc" },
    take: limite,
  });
}
