import { describe, expect, it } from "vitest";
import { pedidoGeracaoSchema } from "./pedidoGeracao";

describe("pedidoGeracaoSchema — tipo foto", () => {
  const base = {
    tipo: "foto" as const,
    tamanho: "feed" as const,
    tag: "Após corte de gastos",
    manicheteRaw: "Prefeitura contrata **Pocah** por R$ 80 mil",
    imagemFundoDataUrl: "data:image/png;base64,AAAA",
  };

  it("aceita um pedido válido no feed", () => {
    expect(pedidoGeracaoSchema.safeParse(base).success).toBe(true);
  });

  it("aceita um pedido válido no stories", () => {
    expect(pedidoGeracaoSchema.safeParse({ ...base, tamanho: "stories" }).success).toBe(true);
  });

  it("rejeita tamanho inválido", () => {
    expect(pedidoGeracaoSchema.safeParse({ ...base, tamanho: "quadrado" }).success).toBe(false);
  });

  it("rejeita mais de um destaque", () => {
    const invalido = { ...base, manicheteRaw: "**Nova Serrana** contrata **Pocah**" };
    expect(pedidoGeracaoSchema.safeParse(invalido).success).toBe(false);
  });

  it("rejeita imagem que não é data URL", () => {
    const invalido = { ...base, imagemFundoDataUrl: "https://exemplo.com/foto.png" };
    expect(pedidoGeracaoSchema.safeParse(invalido).success).toBe(false);
  });

  it("rejeita chamada vazia", () => {
    expect(pedidoGeracaoSchema.safeParse({ ...base, tag: "  " }).success).toBe(false);
  });
});

describe("pedidoGeracaoSchema — tipo card", () => {
  const base = {
    tipo: "card" as const,
    tamanho: "feed" as const,
    rotulo: "Sem água, sem resposta",
    manchete: "Esgoto contamina poço que abastece Ripas",
    tema: "claro" as const,
  };

  it("aceita um pedido válido", () => {
    expect(pedidoGeracaoSchema.safeParse(base).success).toBe(true);
  });

  it("aceita tamanho stories", () => {
    expect(pedidoGeracaoSchema.safeParse({ ...base, tamanho: "stories" }).success).toBe(true);
  });

  it("rejeita tema inválido", () => {
    expect(pedidoGeracaoSchema.safeParse({ ...base, tema: "azul" }).success).toBe(false);
  });
});
