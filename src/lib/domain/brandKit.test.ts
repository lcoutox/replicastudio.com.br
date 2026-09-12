import { describe, expect, it } from "vitest";
import { REPLICA_BRAND_KIT, validarBrandKit } from "./brandKit";

describe("REPLICA_BRAND_KIT", () => {
  it("não tem erros de validação", () => {
    expect(validarBrandKit(REPLICA_BRAND_KIT)).toEqual([]);
  });

  it("usa o azul oficial da marca", () => {
    expect(REPLICA_BRAND_KIT.corAzul).toBe("#325BFF");
  });
});

describe("validarBrandKit", () => {
  it("aponta cor hex inválida", () => {
    const kit = { ...REPLICA_BRAND_KIT, corAzul: "azul" };
    expect(validarBrandKit(kit)).toContain('corAzul não é uma cor hex válida: "azul"');
  });

  it("aponta SVG de logo ausente", () => {
    const kit = { ...REPLICA_BRAND_KIT, logoPositivoSvg: "" };
    expect(validarBrandKit(kit)).toContain("logoPositivoSvg não parece um SVG válido");
  });
});
