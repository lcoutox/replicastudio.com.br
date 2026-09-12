import { describe, expect, it } from "vitest";
import { editoriasPrioritarias, linhaEditorialSchema } from "./linhaEditorial";

const linha = linhaEditorialSchema.parse([
  { escopo: "nova-serrana", editoriasPrioritarias: ["politica", "saude", "cultura"] },
  { escopo: "nacional", editoriasPrioritarias: ["politica", "economia"] },
]);

describe("editoriasPrioritarias", () => {
  it("retorna as editorias do escopo correspondente", () => {
    expect(editoriasPrioritarias(linha, "nova-serrana")).toEqual(["politica", "saude", "cultura"]);
    expect(editoriasPrioritarias(linha, "nacional")).toEqual(["politica", "economia"]);
  });

  it("retorna lista vazia pra escopo não declarado, em vez de quebrar", () => {
    expect(editoriasPrioritarias(linha, "internacional")).toEqual([]);
  });
});

describe("linhaEditorialSchema", () => {
  it("rejeita foco sem nenhuma editoria", () => {
    expect(() => linhaEditorialSchema.parse([{ escopo: "nova-serrana", editoriasPrioritarias: [] }])).toThrow();
  });
});
