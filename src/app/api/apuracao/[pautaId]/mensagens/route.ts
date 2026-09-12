import { NextResponse } from "next/server";
import { novoPedidoSchema } from "@/lib/domain/apuracao";
import { adicionarMensagem, getApuracaoCompleta, getOuCriarApuracao } from "@/lib/db/apuracaoRepository";
import { getPautaPorId } from "@/lib/db/pautaRepository";
import { gerarSugestao } from "@/lib/apuracao/agente";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ pautaId: string }> }) {
  const { pautaId } = await params;
  const analisado = novoPedidoSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const pauta = await getPautaPorId(pautaId);
  if (!pauta) {
    return NextResponse.json({ erro: "Pauta não encontrada." }, { status: 404 });
  }

  const apuracao = await getOuCriarApuracao(pautaId);
  const completa = await getApuracaoCompleta(pautaId);
  const fontes = completa?.fontes ?? [];

  await adicionarMensagem(apuracao.id, "usuario", analisado.data.conteudo);

  let sugestao: string;
  try {
    sugestao = await gerarSugestao(pauta, fontes, analisado.data.dossieAtual, analisado.data.conteudo);
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? `Falha ao consultar o agente: ${erro.message}` : "Falha ao consultar o agente." },
      { status: 502 },
    );
  }

  const mensagemSugestao = await adicionarMensagem(apuracao.id, "agente", sugestao);
  return NextResponse.json(mensagemSugestao);
}
