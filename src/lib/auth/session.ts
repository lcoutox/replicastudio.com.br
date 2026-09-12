const NOME_COOKIE = "replica_studio_session";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * Usa Web Crypto (`globalThis.crypto.subtle`) em vez de `node:crypto` de propósito:
 * este módulo é importado pelo middleware, que roda em Edge Runtime — lá o módulo
 * `node:crypto` não está disponível, só a API padrão de Web Crypto (suportada
 * também pelo Node 20+, então o mesmo código funciona nas rotas de API normais).
 */

function segredo(): string {
  const valor = process.env.SESSION_SECRET;
  if (!valor) throw new Error("SESSION_SECRET não configurado.");
  return valor;
}

async function chaveHmac(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function assinar(payload: string): Promise<string> {
  const chave = await chaveHmac();
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(payload));
  return Buffer.from(assinatura).toString("hex");
}

/** Comparação em tempo constante sem depender de node:crypto (funciona em Edge). */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferenca === 0;
}

/**
 * v1 tem um usuário só (gate por senha compartilhada, ver docs/PRD.md seção 8).
 * O "token" é só um timestamp de expiração + assinatura HMAC — não guarda
 * identidade nenhuma porque não existe tabela de usuário ainda.
 */
export async function criarTokenSessao(): Promise<string> {
  const expiraEm = Date.now() + DURACAO_MS;
  const payload = String(expiraEm);
  return `${payload}.${await assinar(payload)}`;
}

export async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return false;

  const esperada = await assinar(payload);
  if (!iguaisEmTempoConstante(esperada, assinatura)) return false;

  const expiraEm = Number(payload);
  return Number.isFinite(expiraEm) && expiraEm > Date.now();
}

export function senhaCorreta(tentativa: string): boolean {
  const esperada = process.env.APP_PASSWORD;
  if (!esperada) throw new Error("APP_PASSWORD não configurado.");
  return iguaisEmTempoConstante(tentativa, esperada);
}

export { NOME_COOKIE };
