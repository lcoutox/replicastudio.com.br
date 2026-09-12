import { describe, expect, it } from "vitest";
import { candidatosDiarioOficial, candidatosLicitacoes, filtrarRecentes, limparHtml, type CandidatoPauta } from "./pauta";

describe("limparHtml", () => {
  it("remove entidades HTML e tags simples", () => {
    expect(limparHtml("AQUISI&Ccedil;&Atilde;O de bens.<br />\r\n&nbsp;")).toBe("AQUISIÇÃO de bens.");
  });

  it("colapsa espaços múltiplos", () => {
    expect(limparHtml("a   b\n\nc")).toBe("a b c");
  });
});

describe("candidatosDiarioOficial", () => {
  it("usa o número da edição como chave externa", () => {
    const item = candidatosDiarioOficial(
      [{ edicao: "2812", data: "2026-09-11 19:01:00", dataAtualizacao: "2026-09-11 19:02:50", edicaoExtra: "S", descricao: "" }],
      "https://exemplo.gov.br/diario-oficial",
    )[0]!;
    expect(item.chaveExterna).toBe("2812");
    expect(item.titulo).toContain("2812");
    expect(item.titulo).toContain("edição extra");
  });

  it("usa mensagem padrão quando a API não traz descrição", () => {
    const item = candidatosDiarioOficial(
      [{ edicao: "100", data: "2026-01-01 10:00:00", dataAtualizacao: "2026-01-01 10:00:00", descricao: "" }],
      "https://exemplo.gov.br/diario-oficial",
    )[0]!;
    expect(item.resumo).toMatch(/sem resumo automático/i);
  });
});

describe("candidatosLicitacoes", () => {
  it("usa o número do processo como chave externa e limpa a descrição", () => {
    const item = candidatosLicitacoes(
      [
        {
          numeroProcesso: 222,
          numeroEdital: 0,
          titulo: "AQUISI&Ccedil;&Atilde;O de utensílios",
          descricao: "AQUISI&Ccedil;&Atilde;O de utensílios.<br />\r\n&nbsp;",
          modalidade: "Pregão Eletrônico",
          situacao: "Aberto",
          dataAtualizacao: "2026-09-01 13:14:13",
        },
      ],
      "https://exemplo.gov.br/editais",
    )[0]!;
    expect(item.chaveExterna).toBe("222");
    expect(item.resumo).toContain("situação: Aberto");
    expect(item.resumo).not.toContain("&Ccedil;");
  });
});

describe("filtrarRecentes", () => {
  const agora = new Date("2026-09-12T12:00:00Z");

  function candidato(publicadoEm: Date | null): CandidatoPauta {
    return { chaveExterna: "x", titulo: "t", resumo: null, urlOrigem: "https://exemplo.gov.br", publicadoEm };
  }

  it("mantém itens dentro da janela de dias", () => {
    const dentro = candidato(new Date("2026-09-05T12:00:00Z")); // 7 dias atrás
    expect(filtrarRecentes([dentro], agora, 21)).toEqual([dentro]);
  });

  it("descarta itens fora da janela", () => {
    const fora = candidato(new Date("2026-01-10T12:00:00Z"));
    expect(filtrarRecentes([fora], agora, 21)).toEqual([]);
  });

  it("mantém itens sem data — melhor mostrar do que esconder por engano", () => {
    const semData = candidato(null);
    expect(filtrarRecentes([semData], agora, 21)).toEqual([semData]);
  });
});
