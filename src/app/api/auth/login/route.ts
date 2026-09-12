import { NextResponse } from "next/server";
import { criarTokenSessao, senhaCorreta, NOME_COOKIE } from "@/lib/auth/session";

export async function POST(req: Request) {
  const { senha } = (await req.json()) as { senha?: string };

  if (!senha || !senhaCorreta(senha)) {
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const token = await criarTokenSessao();
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return resposta;
}
