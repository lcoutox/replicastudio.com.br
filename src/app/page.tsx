"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";

type Tipo = "foto" | "card";
type Tamanho = "feed" | "stories";
type Tema = "claro" | "escuro";

const RAZAO_ASPECTO: Record<Tamanho, string> = { feed: "1080 / 1350", stories: "1080 / 1920" };
const DEBOUNCE_MS = 350;

function lerArquivoComoDataUrl(arquivo: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

export default function PaginaGerador() {
  const [tipo, setTipo] = useState<Tipo>("foto");
  const [tamanho, setTamanho] = useState<Tamanho>("feed");

  const [tag, setTag] = useState("Após corte de gastos");
  const [manicheteRaw, setManicheteRaw] = useState("Prefeitura contrata **Pocah** por R$ 80 mil");
  const [imagemDataUrl, setImagemDataUrl] = useState<string | null>(null);

  const [tema, setTema] = useState<Tema>("claro");
  const [rotulo, setRotulo] = useState("Sem água, sem resposta");
  const [manchete, setManchete] = useState("Esgoto contamina poço que abastece Ripas");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gerandoPreview, setGerandoPreview] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const previewUrlAnteriorRef = useRef<string | null>(null);

  // Carrega uma imagem de exemplo assim que a página abre, pra já existir
  // preview real em vez de tela vazia (formato foto exige imagem de fundo).
  // Sem isso o preview nunca chega a chamar /api/preview: corpoAtual() só
  // monta corpo quando há imagemDataUrl, e sem tratamento de erro aqui uma
  // falha silenciosa (sessão expirada, rede) deixava a página presa em
  // "Carregando preview…" pra sempre.
  useEffect(() => {
    fetch("/exemplo-prefeitura.png")
      .then((r) => {
        if (!r.ok || !r.headers.get("content-type")?.startsWith("image/")) {
          throw new Error("resposta inesperada ao buscar imagem de exemplo");
        }
        return r.blob();
      })
      .then(lerArquivoComoDataUrl)
      .then(setImagemDataUrl)
      .catch(() => setErro("Não foi possível carregar a imagem de exemplo. Envie uma imagem própria ou recarregue a página."));
  }, []);

  async function aoTrocarImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setImagemDataUrl(await lerArquivoComoDataUrl(arquivo));
  }

  function corpoAtual() {
    if (tipo === "foto") {
      if (!imagemDataUrl) return null;
      return { tipo, tamanho, tag, manicheteRaw, imagemFundoDataUrl: imagemDataUrl };
    }
    return { tipo, tamanho, rotulo, manchete, tema };
  }

  // Preview ao vivo: qualquer mudança de campo re-renderiza automaticamente,
  // com um pequeno debounce pra não disparar uma renderização a cada tecla.
  // Chama /api/preview (não persiste nada) — o mesmo renderizador usado pelo
  // download final, então o que aparece aqui é exatamente o que se baixa.
  useEffect(() => {
    const corpo = corpoAtual();
    if (!corpo) return;

    setErro(null);
    setSalvo(false);
    const temporizador = setTimeout(async () => {
      setGerandoPreview(true);
      try {
        const resposta = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          setErro(dados.erro ?? "Não foi possível gerar o preview.");
          return;
        }
        const blob = await resposta.blob();
        const url = URL.createObjectURL(blob);
        if (previewUrlAnteriorRef.current) URL.revokeObjectURL(previewUrlAnteriorRef.current);
        previewUrlAnteriorRef.current = url;
        setPreviewUrl(url);
      } catch {
        setErro("Não foi possível gerar o preview.");
      } finally {
        setGerandoPreview(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, tamanho, tag, manicheteRaw, imagemDataUrl, rotulo, manchete, tema]);

  async function baixarImagem() {
    if (!previewUrl) return;

    // Baixa localmente o preview que já está na tela — sem re-renderizar.
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `replica-${tipo}-${tamanho}-${Date.now()}.png`;
    a.click();

    // Em paralelo, persiste no banco/storage pra entrar no histórico. Se isso
    // falhar, o usuário já tem o arquivo baixado — só avisa que não entrou
    // no histórico.
    const corpo = corpoAtual();
    if (!corpo) return;
    setSalvando(true);
    setSalvo(false);
    try {
      const resposta = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (resposta.ok) setSalvo(true);
      else setErro("Baixado, mas não entrou no histórico — tente de novo.");
    } catch {
      setErro("Baixado, mas não entrou no histórico — tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 64px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>Editor de posts</h1>
        <Link href="/historico" style={{ fontSize: 13, fontWeight: 700 }}>
          Ver histórico →
        </Link>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 380px) 1fr", gap: 28, alignItems: "start" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
            <button type="button" onClick={() => setTipo("foto")} style={botaoSegmento(tipo === "foto")}>
              Notícia com foto
            </button>
            <button type="button" onClick={() => setTipo("card")} style={botaoSegmento(tipo === "card")}>
              Card oficial
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
            <button type="button" onClick={() => setTamanho("feed")} style={botaoSegmento(tamanho === "feed", true)}>
              Feed (4:5)
            </button>
            <button type="button" onClick={() => setTamanho("stories")} style={botaoSegmento(tamanho === "stories", true)}>
              Stories (9:16)
            </button>
          </div>

          {tipo === "foto" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Campo label="Imagem" dica="Foto real da matéria — sem foto própria, use o card oficial.">
                <input type="file" accept="image/*" onChange={aoTrocarImagem} />
              </Campo>
              <Campo label="Chamada" dica="Provocação/gancho — não é categoria.">
                <input value={tag} onChange={(e) => setTag(e.target.value)} style={inputStyle} />
              </Campo>
              <Campo label="Manchete" dica="Envolva um trecho em **asteriscos** para o grifo azul. No máximo um.">
                <textarea value={manicheteRaw} onChange={(e) => setManicheteRaw(e.target.value)} style={{ ...inputStyle, minHeight: 84 }} />
              </Campo>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Campo label="Tema">
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setTema("claro")} style={botaoTema(tema === "claro")}>
                    Claro
                  </button>
                  <button type="button" onClick={() => setTema("escuro")} style={botaoTema(tema === "escuro")}>
                    Escuro
                  </button>
                </div>
              </Campo>
              <Campo label="Rótulo" dica='Ex.: "Em pauta", "Opinião" — ou uma chamada curta.'>
                <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} style={inputStyle} />
              </Campo>
              <Campo label="Manchete" dica="Sem grifo neste formato — segue o brandbook à risca.">
                <textarea value={manchete} onChange={(e) => setManchete(e.target.value)} style={{ ...inputStyle, minHeight: 84 }} />
              </Campo>
            </div>
          )}

          <button
            type="button"
            onClick={baixarImagem}
            disabled={!previewUrl || salvando}
            style={{
              width: "100%",
              marginTop: 22,
              background: "var(--accent)",
              color: "var(--accent-contrast)",
              border: "none",
              borderRadius: 3,
              padding: 14,
              fontWeight: 800,
              fontSize: 15,
              cursor: !previewUrl || salvando ? "default" : "pointer",
              opacity: !previewUrl || salvando ? 0.6 : 1,
            }}
          >
            {salvando ? "Salvando…" : "Baixar imagem"}
          </button>
          {salvo && <p style={{ color: "#1a7f37", fontSize: 13, marginTop: 10 }}>Baixado e salvo no histórico.</p>}
          {erro && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{erro}</p>}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)", margin: 0 }}>
              Preview
            </h2>
            {gerandoPreview && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Atualizando…</span>}
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: 380,
              margin: "0 auto",
              aspectRatio: RAZAO_ASPECTO[tamanho],
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview do post" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: gerandoPreview ? 0.6 : 1, transition: "opacity 150ms" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 20 }}>
                Carregando preview…
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Campo({ label, dica, children }: { label: string; dica?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-muted)" }}>{label}</span>
      {dica && <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{dica}</span>}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 3,
  color: "var(--text)",
  fontSize: 15,
  padding: "10px 12px",
  resize: "vertical",
};

function botaoSegmento(ativo: boolean, secundario = false): React.CSSProperties {
  return {
    border: "none",
    background: ativo ? (secundario ? "var(--surface-2)" : "var(--accent)") : "var(--surface)",
    color: ativo ? (secundario ? "var(--text)" : "var(--accent-contrast)") : "var(--text-muted)",
    fontWeight: 700,
    fontSize: 13.5,
    padding: "11px 8px",
    cursor: "pointer",
    boxShadow: ativo && secundario ? "inset 0 0 0 1.5px var(--accent)" : "none",
  };
}

function botaoTema(ativo: boolean): React.CSSProperties {
  return {
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    padding: "9px 14px",
    borderRadius: 3,
    border: `1px solid ${ativo ? "var(--accent)" : "var(--border)"}`,
    background: ativo ? "#eef1ff" : "var(--surface)",
    color: ativo ? "var(--accent)" : "var(--text)",
  };
}
