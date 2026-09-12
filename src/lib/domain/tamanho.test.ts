import { describe, expect, it } from "vitest";
import { DIMENSOES } from "./tamanho";

describe("DIMENSOES", () => {
  it("feed usa a proporção 4:5 do brandbook", () => {
    expect(DIMENSOES.feed).toEqual({ largura: 1080, altura: 1350 });
  });

  it("stories usa a proporção 9:16 padrão do Instagram", () => {
    expect(DIMENSOES.stories).toEqual({ largura: 1080, altura: 1920 });
  });
});
