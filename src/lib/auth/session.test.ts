import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarTokenSessao, senhaCorreta, tokenValido } from "./session";

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "segredo-de-teste");
  vi.stubEnv("APP_PASSWORD", "correta123");
});

describe("criarTokenSessao / tokenValido", () => {
  it("aceita um token recém-criado", async () => {
    expect(await tokenValido(await criarTokenSessao())).toBe(true);
  });

  it("rejeita token ausente", async () => {
    expect(await tokenValido(undefined)).toBe(false);
  });

  it("rejeita token adulterado", async () => {
    const token = await criarTokenSessao();
    const [payload] = token.split(".");
    expect(await tokenValido(`${payload}.assinaturaFalsa`)).toBe(false);
  });

  it("rejeita token expirado", async () => {
    const expiradoEm = Date.now() - 1000;
    const payloadExpirado = String(expiradoEm);
    const chave = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("segredo-de-teste"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const assinaturaBuf = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(payloadExpirado));
    const assinatura = Buffer.from(assinaturaBuf).toString("hex");
    expect(await tokenValido(`${payloadExpirado}.${assinatura}`)).toBe(false);
  });
});

describe("senhaCorreta", () => {
  it("aceita a senha configurada", () => {
    expect(senhaCorreta("correta123")).toBe(true);
  });

  it("rejeita senha errada", () => {
    expect(senhaCorreta("errada")).toBe(false);
  });

  it("rejeita senha de tamanho diferente sem lançar erro", () => {
    expect(() => senhaCorreta("x")).not.toThrow();
    expect(senhaCorreta("x")).toBe(false);
  });
});
