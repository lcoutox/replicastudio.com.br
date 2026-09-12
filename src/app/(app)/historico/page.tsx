import { getWorkspaceUnico } from "@/lib/db/brandKitRepository";
import { listarPosts } from "@/lib/db/postsRepository";
import { textoSemMarcacao } from "@/lib/domain/highlightedText";

export const dynamic = "force-dynamic";

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function PaginaHistorico() {
  const workspace = await getWorkspaceUnico();
  const posts = await listarPosts(workspace.id);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-1 font-serif text-2xl font-semibold text-neutral-900">Histórico de posts</h1>
      <p className="mb-7 text-sm text-neutral-500">Tudo que já foi gerado e salvo pelo editor.</p>

      {posts.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-0 px-6 py-14 text-center">
          <p className="text-sm text-neutral-500">Nenhum post gerado ainda.</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li
            key={post.id}
            className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-3.5 transition-shadow hover:shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imagemResultadoUrl}
              alt=""
              width={56}
              height={70}
              className="h-[70px] w-14 flex-none rounded-lg object-cover ring-1 ring-neutral-900/5"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold tracking-wide text-brand-600 uppercase">
                {post.tipo === "foto" ? "Notícia com foto" : "Card oficial"} · {post.tamanho === "feed" ? "Feed" : "Stories"}
              </div>
              <div className="truncate text-[14.5px] font-medium text-neutral-900">{textoSemMarcacao(post.manicheteRaw)}</div>
              <div className="text-xs text-neutral-500">{formatoData.format(post.criadoEm)}</div>
            </div>
            <a
              href={post.imagemResultadoUrl}
              download
              className="flex-none cursor-pointer rounded-md border border-neutral-200 px-3 py-2 text-xs font-bold whitespace-nowrap text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              Baixar
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
