"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { PageHeader } from "./PageHeader";

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
    <main className="mx-auto max-w-5xl px-5 py-8">
      <PageHeader title="Editor de posts" subtitle="Gere a imagem com a identidade visual da Réplica e baixe direto pro Instagram." />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <div className="rounded-xl border border-neutral-200 bg-neutral-0 p-5">
          <Segmentado
            opcoes={[
              { valor: "foto", label: "Notícia com foto" },
              { valor: "card", label: "Card oficial" },
            ]}
            valor={tipo}
            onMudar={setTipo}
            className="mb-3.5"
          />
          <Segmentado
            opcoes={[
              { valor: "feed", label: "Feed (4:5)" },
              { valor: "stories", label: "Stories (9:16)" },
            ]}
            valor={tamanho}
            onMudar={setTamanho}
            className="mb-5"
          />

          {tipo === "foto" ? (
            <div className="flex flex-col gap-5">
              <Campo label="Imagem" dica="Foto real da matéria — sem foto própria, use o card oficial.">
                <input
                  type="file"
                  accept="image/*"
                  onChange={aoTrocarImagem}
                  className="w-full cursor-pointer text-sm text-neutral-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-neutral-700 hover:file:bg-neutral-200"
                />
              </Campo>
              <Campo label="Chamada" dica="Provocação/gancho — não é categoria.">
                <input value={tag} onChange={(e) => setTag(e.target.value)} className={campoInputClasse} />
              </Campo>
              <Campo label="Manchete" dica="Envolva um trecho em **asteriscos** para o grifo azul. No máximo um.">
                <textarea value={manicheteRaw} onChange={(e) => setManicheteRaw(e.target.value)} className={`${campoInputClasse} min-h-21 resize-y`} />
              </Campo>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <Campo label="Tema">
                <div className="flex gap-2">
                  <BotaoPill label="Claro" ativo={tema === "claro"} onClick={() => setTema("claro")} />
                  <BotaoPill label="Escuro" ativo={tema === "escuro"} onClick={() => setTema("escuro")} />
                </div>
              </Campo>
              <Campo label="Rótulo" dica='Ex.: "Em pauta", "Opinião" — ou uma chamada curta.'>
                <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} className={campoInputClasse} />
              </Campo>
              <Campo label="Manchete" dica="Sem grifo neste formato — segue o brandbook à risca.">
                <textarea value={manchete} onChange={(e) => setManchete(e.target.value)} className={`${campoInputClasse} min-h-21 resize-y`} />
              </Campo>
            </div>
          )}

          <button
            type="button"
            onClick={baixarImagem}
            disabled={!previewUrl || salvando}
            className="mt-6 w-full cursor-pointer rounded-lg bg-brand-500 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-default disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Baixar imagem"}
          </button>
          {salvo && <p className="mt-2.5 text-sm text-success-500">Baixado e salvo no histórico.</p>}
          {erro && (
            <p className="mt-2.5 text-sm text-danger-500" role="alert">
              {erro}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wide text-neutral-500 uppercase">Preview</h2>
            {gerandoPreview && <span className="text-xs text-neutral-400">Atualizando…</span>}
          </div>

          <div
            className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
            style={{ aspectRatio: RAZAO_ASPECTO[tamanho] }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview do post"
                className="h-full w-full object-cover transition-opacity duration-150"
                style={{ opacity: gerandoPreview ? 0.6 : 1 }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-neutral-400">Carregando preview…</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Campo({ label, dica, children }: { label: string; dica?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-wide text-neutral-500 uppercase">{label}</span>
      {dica && <span className="text-xs text-neutral-400">{dica}</span>}
      {children}
    </label>
  );
}

const campoInputClasse =
  "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors focus:border-brand-500 focus:bg-neutral-0";

function Segmentado<T extends string>({
  opcoes,
  valor,
  onMudar,
  className = "",
}: {
  opcoes: { valor: T; label: string }[];
  valor: T;
  onMudar: (valor: T) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 overflow-hidden rounded-lg border border-neutral-200 ${className}`}>
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          onClick={() => onMudar(opcao.valor)}
          aria-pressed={valor === opcao.valor}
          className={`cursor-pointer px-2 py-2.5 text-[13.5px] font-bold transition-colors ${
            valor === opcao.valor ? "bg-brand-500 text-white" : "text-neutral-500 hover:bg-neutral-50"
          }`}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  );
}

function BotaoPill({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`cursor-pointer rounded-md border px-3.5 py-2 text-[13px] font-bold transition-colors ${
        ativo ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}
