/**
 * Tamanho de saída da imagem — eixo independente do tipo de template
 * (foto/card). Cada combinação (tipo × tamanho) tem seu próprio layout no
 * Satori, porque a zona segura do Stories não é só "esticar" o feed.
 */
export type Tamanho = "feed" | "stories";

export type Dimensoes = { largura: number; altura: number };

export const DIMENSOES: Record<Tamanho, Dimensoes> = {
  feed: { largura: 1080, altura: 1350 },
  stories: { largura: 1080, altura: 1920 },
};

/**
 * Zona segura do Stories: área reservada pra interface do próprio Instagram
 * (perfil/close no topo, caixa de resposta/reações embaixo) — conteúdo dentro
 * dessa faixa fica coberto pela UI do app. Números do brandbook da Réplica
 * (ver replica/templates/Replica-Brandbook.pdf, página "Stories e Avatar").
 */
export const ZONA_SEGURA_STORIES = { topo: 250, base: 320 };
