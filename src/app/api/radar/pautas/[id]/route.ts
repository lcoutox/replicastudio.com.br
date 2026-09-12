import { NextResponse } from "next/server";
import { z } from "zod";
import { atualizarStatusPauta } from "@/lib/db/pautaRepository";
import { getOuCriarApuracao } from "@/lib/db/apuracaoRepository";

export const runtime = "nodejs";

const corpoSchema = z.object({ status: z.enum(["pendente", "apuracao", "dispensada"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analisado = corpoSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const pauta = await atualizarStatusPauta(id, analisado.data.status);

  // Sala de apuração nasce junto com a transição de status — sem passo
  // manual extra de "criar sala".
  if (analisado.data.status === "apuracao") {
    await getOuCriarApuracao(id);
  }

  return NextResponse.json(pauta);
}
