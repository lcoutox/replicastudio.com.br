import { NextResponse } from "next/server";
import { z } from "zod";
import { atualizarStatusPauta } from "@/lib/db/pautaRepository";

export const runtime = "nodejs";

const corpoSchema = z.object({ status: z.enum(["pendente", "apuracao", "dispensada"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analisado = corpoSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const pauta = await atualizarStatusPauta(id, analisado.data.status);
  return NextResponse.json(pauta);
}
