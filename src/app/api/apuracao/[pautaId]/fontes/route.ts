import { NextResponse } from "next/server";
import { novaFonteSchema } from "@/lib/domain/apuracao";
import { adicionarFonte, getOuCriarApuracao } from "@/lib/db/apuracaoRepository";
import { subirArquivo } from "@/lib/storage/r2";

export const runtime = "nodejs";

function parsearDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } {
  const [cabecalho, base64] = dataUrl.split(",");
  const contentType = cabecalho?.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  return { contentType, buffer: Buffer.from(base64 ?? "", "base64") };
}

export async function POST(req: Request, { params }: { params: Promise<{ pautaId: string }> }) {
  const { pautaId } = await params;
  const analisado = novaFonteSchema.safeParse(await req.json());
  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const apuracao = await getOuCriarApuracao(pautaId);
  const dados = analisado.data;

  if (dados.tipo === "arquivo") {
    const { contentType, buffer } = parsearDataUrl(dados.conteudoBase64);
    const arquivoUrl = await subirArquivo(buffer, dados.nomeArquivo, contentType);
    const fonte = await adicionarFonte(apuracao.id, { tipo: "arquivo", conteudo: dados.nomeArquivo, arquivoUrl, descricao: dados.descricao });
    return NextResponse.json(fonte);
  }

  const fonte = await adicionarFonte(apuracao.id, { tipo: dados.tipo, conteudo: dados.conteudo, descricao: dados.descricao });
  return NextResponse.json(fonte);
}
