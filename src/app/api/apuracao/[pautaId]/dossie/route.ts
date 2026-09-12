import { NextResponse } from "next/server";
import { z } from "zod";
import { atualizarDossie } from "@/lib/db/apuracaoRepository";

export const runtime = "nodejs";

const corpoSchema = z.object({ dossie: z.string().max(20000) });

export async function PATCH(req: Request, { params }: { params: Promise<{ pautaId: string }> }) {
  const { pautaId } = await params;
  const analisado = corpoSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const apuracao = await atualizarDossie(pautaId, analisado.data.dossie);
  return NextResponse.json(apuracao);
}
