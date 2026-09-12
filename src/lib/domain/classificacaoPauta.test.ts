import { describe, expect, it } from "vitest";
import { decidirStatusInicial, validarClassificacao, montarPromptClassificacao } from "./classificacaoPauta";
import type { CandidatoPauta } from "./pauta";

const candidato: CandidatoPauta = {
  chaveExterna: "1",
  titulo: "Contratação de show por R$ 80 mil",
  resumo: "Prefeitura contrata cantora dias após anunciar contenção de gastos.",
  urlOrigem: "https://exemplo.gov.br",
  publicadoEm: null,
};

describe("montarPromptClassificacao", () => {
  it("inclui as editorias prioritárias no prompt", () => {
    const prompt = montarPromptClassificacao(candidato, { categoriaFonte: "licitacoes", editoriasPrioritarias: ["saude", "politica"] });
    expect(prompt).toContain("saude, politica");
    expect(prompt).toContain(candidato.titulo);
  });

  it("avisa quando não há foco declarado, em vez de inventar um", () => {
    const prompt = montarPromptClassificacao(candidato, { categoriaFonte: "licitacoes", editoriasPrioritarias: [] });
    expect(prompt).toContain("nenhum foco editorial declarado");
  });
});

describe("validarClassificacao", () => {
  it("aceita um input bem formado", () => {
    const resultado = validarClassificacao({ pontuacao: 8, categorias: ["politica"], resumo: "Resumo curto.", justificativa: "Contradição clara." });
    expect(resultado.pontuacao).toBe(8);
    expect(resultado.categorias).toEqual(["politica"]);
  });

  it("rejeita pontuação fora da faixa 0-10", () => {
    expect(() => validarClassificacao({ pontuacao: 15, categorias: [], resumo: "x", justificativa: "y" })).toThrow();
  });

  it("rejeita input sem os campos obrigatórios", () => {
    expect(() => validarClassificacao({ pontuacao: 5 })).toThrow();
  });

  it("aceita categorias ausentes, usando lista vazia como padrão", () => {
    const resultado = validarClassificacao({ pontuacao: 3, resumo: "x", justificativa: "y" });
    expect(resultado.categorias).toEqual([]);
  });
});

describe("decidirStatusInicial", () => {
  it("marca como pendente quando atinge o limiar", () => {
    expect(decidirStatusInicial(5)).toEqual({ status: "pendente", descarteAutomatico: false });
    expect(decidirStatusInicial(10)).toEqual({ status: "pendente", descarteAutomatico: false });
  });

  it("descarta automaticamente abaixo do limiar", () => {
    expect(decidirStatusInicial(4)).toEqual({ status: "dispensada", descarteAutomatico: true });
    expect(decidirStatusInicial(0)).toEqual({ status: "dispensada", descarteAutomatico: true });
  });
});
