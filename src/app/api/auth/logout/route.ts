import { NextResponse } from "next/server";
import { NOME_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.delete(NOME_COOKIE);
  return resposta;
}
