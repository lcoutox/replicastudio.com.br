import { describe, expect, it } from "vitest";
import { formatarRespostaComCitacoes, marcarSugestaoSchema, novaFonteSchema, novoPedidoSchema } from "./apuracao";

describe("novaFonteSchema", () => {
  it("aceita link válido", () => {
    const resultado = novaFonteSchema.parse({ tipo: "link", conteudo: "https://exemplo.gov.br/decreto" });
    expect(resultado.tipo).toBe("link");
  });

  it("rejeita link inválido", () => {
    expect(() => novaFonteSchema.parse({ tipo: "link", conteudo: "não é url" })).toThrow();
  });

  it("aceita nota de texto sem URL", () => {
    const resultado = novaFonteSchema.parse({ tipo: "nota", conteudo: "Vereador X confirmou por telefone que..." });
    expect(resultado.tipo).toBe("nota");
  });

  it("rejeita nota vazia", () => {
    expect(() => novaFonteSchema.parse({ tipo: "nota", conteudo: "  " })).toThrow();
  });

  it("aceita arquivo como data URL", () => {
    const resultado = novaFonteSchema.parse({ tipo: "arquivo", nomeArquivo: "decreto.pdf", conteudoBase64: "data:application/pdf;base64,AAAA" });
    expect(resultado.tipo).toBe("arquivo");
  });

  it("rejeita arquivo sem data URL", () => {
    expect(() => novaFonteSchema.parse({ tipo: "arquivo", nomeArquivo: "x.pdf", conteudoBase64: "AAAA" })).toThrow();
  });
});

describe("novoPedidoSchema", () => {
  it("rejeita pedido vazio", () => {
    expect(() => novoPedidoSchema.parse({ conteudo: "", dossieAtual: "" })).toThrow();
  });

  it("aceita dossiê atual vazio (documento ainda não escrito)", () => {
    const resultado = novoPedidoSchema.parse({ conteudo: "Resuma as fontes", dossieAtual: "" });
    expect(resultado.dossieAtual).toBe("");
  });
});

describe("marcarSugestaoSchema", () => {
  it("aceita aceito true/false", () => {
    expect(marcarSugestaoSchema.parse({ aceito: true }).aceito).toBe(true);
    expect(marcarSugestaoSchema.parse({ aceito: false }).aceito).toBe(false);
  });

  it("rejeita valor não booleano", () => {
    expect(() => marcarSugestaoSchema.parse({ aceito: "sim" })).toThrow();
  });
});

describe("formatarRespostaComCitacoes", () => {
  it("devolve o texto puro quando não há citação", () => {
    expect(formatarRespostaComCitacoes("Resposta sem fonte.", [])).toBe("Resposta sem fonte.");
  });

  it("adiciona rodapé de fontes citadas", () => {
    const resultado = formatarRespostaComCitacoes("Resposta.", [{ url: "https://exemplo.gov.br", titulo: "Site oficial" }]);
    expect(resultado).toContain("Fontes citadas:");
    expect(resultado).toContain("Site oficial — https://exemplo.gov.br");
  });

  it("deduplica citações repetidas pela URL", () => {
    const resultado = formatarRespostaComCitacoes("x", [
      { url: "https://a.com", titulo: "A" },
      { url: "https://a.com", titulo: "A" },
      { url: "https://b.com", titulo: "B" },
    ]);
    expect(resultado.match(/https:\/\/a\.com/g)).toHaveLength(1);
    expect(resultado).toContain("https://b.com");
  });
});
