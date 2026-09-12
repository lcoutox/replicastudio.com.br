import { NextResponse } from "next/server";
import { marcarSugestaoSchema } from "@/lib/domain/apuracao";
import { marcarSugestao } from "@/lib/db/apuracaoRepository";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ mensagemId: string }> }) {
  const { mensagemId } = await params;
  const analisado = marcarSugestaoSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const mensagem = await marcarSugestao(mensagemId, analisado.data.aceito);
  return NextResponse.json(mensagem);
}
