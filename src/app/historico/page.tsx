import Link from "next/link";
import { getWorkspaceUnico } from "@/lib/db/brandKitRepository";
import { listarPosts } from "@/lib/db/postsRepository";
import { textoSemMarcacao } from "@/lib/domain/highlightedText";

export const dynamic = "force-dynamic";

export default async function PaginaHistorico() {
  const workspace = await getWorkspaceUnico();
  const posts = await listarPosts(workspace.id);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 64px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>Histórico de posts</h1>
        <Link href="/" style={{ fontSize: 13, fontWeight: 700 }}>
          ← Voltar pro editor
        </Link>
      </header>

      {posts.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Nenhum post gerado ainda.</p>}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {posts.map((post) => (
          <li
            key={post.id}
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: 14,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imagemResultadoUrl} alt="" width={64} height={80} style={{ objectFit: "cover", borderRadius: 3, flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)" }}>
                {post.tipo === "foto" ? "Notícia com foto" : "Card oficial"} · {post.tamanho === "feed" ? "Feed" : "Stories"}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{textoSemMarcacao(post.manicheteRaw)}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(post.criadoEm)}
              </div>
            </div>
            <a
              href={post.imagemResultadoUrl}
              download
              style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 3 }}
            >
              Baixar
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
