import { NextResponse } from "next/server";
import { removerFonte } from "@/lib/db/apuracaoRepository";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ fonteId: string }> }) {
  const { fonteId } = await params;
  await removerFonte(fonteId);
  return NextResponse.json({ ok: true });
}
