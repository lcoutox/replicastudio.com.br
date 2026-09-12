import { describe, expect, it } from "vitest";
import { montarPromptExtracao, validarExtracao } from "./extracaoDiarioOficial";

describe("montarPromptExtracao", () => {
  it("inclui o número da edição e o texto no prompt", () => {
    const prompt = montarPromptExtracao("Decreto tal e tal.", "2812");
    expect(prompt).toContain("2812");
    expect(prompt).toContain("Decreto tal e tal.");
  });

  it("avisa quando o texto foi cortado por exceder o limite", () => {
    const textoGigante = "a".repeat(50_000);
    const prompt = montarPromptExtracao(textoGigante, "1");
    expect(prompt).toContain("cortado por ser muito longo");
  });

  it("não avisa de corte quando o texto cabe inteiro", () => {
    const prompt = montarPromptExtracao("texto curto", "1");
    expect(prompt).not.toContain("cortado");
  });
});

describe("validarExtracao", () => {
  it("aceita uma lista de atos bem formada", () => {
    const atos = validarExtracao({
      atos: [{ titulo: "Decreto 084/2026", resumo: "Autoriza contenção de gastos.", trechoOriginal: "Art. 1º Fica autorizada a contenção de gastos..." }],
    });
    expect(atos).toHaveLength(1);
    expect(atos[0]!.titulo).toBe("Decreto 084/2026");
    expect(atos[0]!.trechoOriginal).toContain("Art. 1º");
  });

  it("aceita lista vazia — edição sem ato relevante", () => {
    expect(validarExtracao({ atos: [] })).toEqual([]);
  });

  it("rejeita ato sem os campos obrigatórios", () => {
    expect(() => validarExtracao({ atos: [{ titulo: "x" }] })).toThrow();
  });
});
