import { NextResponse } from "next/server";
import { atualizarRadar } from "@/lib/radar/atualizar";
import { listarPautas } from "@/lib/db/pautaRepository";

export const runtime = "nodejs";

/**
 * Disparo manual do radar (botão "Atualizar agora") — nunca automático.
 * Ver docs/PRD.md: checagem por trigger, não por cron, pra falha de uma
 * fonte aparecer na hora em vez de sumir silenciosamente num job agendado.
 */
export async function POST() {
  const resultados = await atualizarRadar();
  const pautas = await listarPautas();
  return NextResponse.json({ resultados, pautas });
}
