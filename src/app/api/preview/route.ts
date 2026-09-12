import { pedidoGeracaoSchema } from "@/lib/domain/pedidoGeracao";
import { getBrandKitAtivo } from "@/lib/db/brandKitRepository";
import { renderizarPost } from "@/lib/render/renderPost";

export const runtime = "nodejs"; // satori/@resvg exigem Node — nunca Edge.

/**
 * Renderiza o post com os dados atuais do formulário e devolve o PNG direto
 * na resposta — sem gravar nada no banco nem no storage. Existe pra viabilizar
 * o preview ao vivo (chamado a cada mudança de campo, com debounce, no
 * cliente) sem encher o histórico de rascunho a cada tecla digitada.
 *
 * Usa exatamente o mesmo `renderizarPost` que /api/gerar — garante que o que
 * o usuário vê no preview é pixel-a-pixel o que sai ao baixar, o que era
 * justamente o problema da versão em Artifact (preview em CSS, export em
 * html2canvas, os dois podiam divergir).
 */
export async function POST(req: Request) {
  const corpo = await req.json();
  const analisado = pedidoGeracaoSchema.safeParse(corpo);

  if (!analisado.success) {
    return Response.json({ erro: analisado.error.issues[0]?.message ?? "Pedido inválido." }, { status: 400 });
  }

  const pedido = analisado.data;
  const brandKit = await getBrandKitAtivo();

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

  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
