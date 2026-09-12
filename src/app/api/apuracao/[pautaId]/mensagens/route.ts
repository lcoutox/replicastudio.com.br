import { NextResponse } from "next/server";
import { novaMensagemSchema } from "@/lib/domain/apuracao";
import { adicionarMensagem, getApuracaoCompleta, getOuCriarApuracao } from "@/lib/db/apuracaoRepository";
import { getPautaPorId } from "@/lib/db/pautaRepository";
import { responderNaSala } from "@/lib/apuracao/agente";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ pautaId: string }> }) {
  const { pautaId } = await params;
  const analisado = novaMensagemSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const pauta = await getPautaPorId(pautaId);
  if (!pauta) {
    return NextResponse.json({ erro: "Pauta não encontrada." }, { status: 404 });
  }

  const apuracao = await getOuCriarApuracao(pautaId);
  const completa = await getApuracaoCompleta(pautaId);
  const historico = completa?.mensagens ?? [];
  const fontes = completa?.fontes ?? [];

  await adicionarMensagem(apuracao.id, "usuario", analisado.data.conteudo);

  let respostaAgente: string;
  try {
    respostaAgente = await responderNaSala(pauta, fontes, historico, analisado.data.conteudo);
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? `Falha ao consultar o agente: ${erro.message}` : "Falha ao consultar o agente." },
      { status: 502 },
    );
  }

  const mensagemAgente = await adicionarMensagem(apuracao.id, "agente", respostaAgente);
  return NextResponse.json(mensagemAgente);
}
