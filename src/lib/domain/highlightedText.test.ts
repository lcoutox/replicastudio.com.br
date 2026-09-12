import { describe, expect, it } from "vitest";
import { analisarDestaque, contarDestaques, textoSemMarcacao } from "./highlightedText";

describe("analisarDestaque", () => {
  it("retorna um único segmento não destacado quando não há marcação", () => {
    expect(analisarDestaque("Prefeitura contrata Pocah")).toEqual([
      { texto: "Prefeitura contrata Pocah", destaque: false },
    ]);
  });

  it("separa um trecho destacado no meio da frase", () => {
    expect(analisarDestaque("Prefeitura contrata **Pocah** por R$ 80 mil")).toEqual([
      { texto: "Prefeitura contrata ", destaque: false },
      { texto: "Pocah", destaque: true },
      { texto: " por R$ 80 mil", destaque: false },
    ]);
  });

  it("suporta mais de um destaque na mesma manchete", () => {
    expect(analisarDestaque("**Nova Serrana** contrata Pocah por **R$ 80 mil**")).toEqual([
      { texto: "Nova Serrana", destaque: true },
      { texto: " contrata Pocah por ", destaque: false },
      { texto: "R$ 80 mil", destaque: true },
    ]);
  });

  it("ignora marcação vazia sem quebrar", () => {
    expect(analisarDestaque("Antes **** depois")).toEqual([
      { texto: "Antes ", destaque: false },
      { texto: " depois", destaque: false },
    ]);
  });

  it("lida com string vazia", () => {
    expect(analisarDestaque("")).toEqual([]);
  });
});

describe("contarDestaques", () => {
  it("conta zero quando não há marcação", () => {
    expect(contarDestaques("Sem grifo aqui")).toBe(0);
  });

  it("conta corretamente múltiplos destaques", () => {
    expect(contarDestaques("**um** e **dois**")).toBe(2);
  });
});

describe("textoSemMarcacao", () => {
  it("remove os asteriscos preservando o texto", () => {
    expect(textoSemMarcacao("Prefeitura contrata **Pocah** por **R$ 80 mil**")).toBe(
      "Prefeitura contrata Pocah por R$ 80 mil",
    );
  });
});
