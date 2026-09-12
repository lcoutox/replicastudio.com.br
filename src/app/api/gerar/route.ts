import { NextResponse } from "next/server";
import { pedidoGeracaoSchema } from "@/lib/domain/pedidoGeracao";
import { getBrandKitAtivo, getWorkspaceUnico } from "@/lib/db/brandKitRepository";
import { renderizarPost } from "@/lib/render/renderPost";
import { subirImagem } from "@/lib/storage/r2";
import { criarPost } from "@/lib/db/postsRepository";

export const runtime = "nodejs"; // satori/@resvg exigem Node — nunca Edge.

/**
 * Gera E PERSISTE (banco + storage) — é a ação de "baixar imagem" do editor,
 * que também grava no histórico. Pra live preview sem persistir nada, ver
 * /api/preview.
 */
export async function POST(req: Request) {
  const corpo = await req.json();
  const analisado = pedidoGeracaoSchema.safeParse(corpo);

  if (!analisado.success) {
    return NextResponse.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const pedido = analisado.data;
  const brandKit = await getBrandKitAtivo();
  const workspace = await getWorkspaceUnico();

  const png =
    pedido.tipo === "foto"
      ? await renderizarPost(
          { tipo: "foto", tamanho: pedido.tamanho, tag: pedido.tag, manicheteRaw: pedido.manicheteRaw, imagemFundoDataUrl: pedido.imagemFundoDataUrl },
          brandKit,
        )
      : await renderizarPost(
          { tipo: "card", tamanho: pedido.tamanho, rotulo: pedido.rotulo, manchete: pedido.manchete, tema: pedido.tema },
          brandKit,
        );

  const imagemResultadoUrl = await subirImagem(png, pedido.tipo);

  const post = await criarPost({
    workspaceId: workspace.id,
    tipo: pedido.tipo,
    tamanho: pedido.tamanho,
    tagOuRotulo: pedido.tipo === "foto" ? pedido.tag : pedido.rotulo,
    manicheteRaw: pedido.tipo === "foto" ? pedido.manicheteRaw : pedido.manchete,
    tema: pedido.tipo === "card" ? pedido.tema : undefined,
    // A imagem de origem (upload do usuário) não é persistida separadamente no v1 —
    // só o resultado final. Se isso for necessário depois (ex.: reeditar um post
    // já gerado), sobe o upload pro R2 aqui antes de renderizar e guarda a URL.
    imagemResultadoUrl,
  });

  return NextResponse.json({ id: post.id, url: imagemResultadoUrl });
}
