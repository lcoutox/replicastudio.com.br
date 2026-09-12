"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type TipoFonte = "link" | "arquivo" | "nota";
type Papel = "usuario" | "agente";

export type ApuracaoView = {
  pauta: { id: string; titulo: string; resumo: string | null; urlOrigem: string; fonteNome: string };
  dossie: string;
  fontes: { id: string; tipo: TipoFonte; conteudo: string; arquivoUrl: string | null; descricao: string | null; criadoEm: string }[];
  mensagens: { id: string; papel: Papel; conteudo: string; criadoEm: string }[];
};

const ROTULO_TIPO: Record<TipoFonte, string> = { link: "Link", arquivo: "Arquivo", nota: "Nota sem fonte" };

function lerArquivoComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

export function ApuracaoClient({ inicial }: { inicial: ApuracaoView }) {
  const [dossie, setDossie] = useState(inicial.dossie);
  const [dossieSalvo, setDossieSalvo] = useState(inicial.dossie);
  const [salvandoDossie, setSalvandoDossie] = useState(false);

  const [fontes, setFontes] = useState(inicial.fontes);
  const [tipoNovaFonte, setTipoNovaFonte] = useState<TipoFonte>("link");
  const [conteudoNovaFonte, setConteudoNovaFonte] = useState("");
  const [arquivoNovaFonte, setArquivoNovaFonte] = useState<File | null>(null);
  const [adicionandoFonte, setAdicionandoFonte] = useState(false);

  const [mensagens, setMensagens] = useState(inicial.mensagens);
  const [mensagemInput, setMensagemInput] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const fimDaConversaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaConversaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  async function salvarDossie() {
    setSalvandoDossie(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/apuracao/${inicial.pauta.id}/dossie`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossie }),
      });
      if (!resposta.ok) throw new Error();
      setDossieSalvo(dossie);
    } catch {
      setErro("Não foi possível salvar o dossiê agora.");
    } finally {
      setSalvandoDossie(false);
    }
  }

  async function adicionarFonte() {
    setAdicionandoFonte(true);
    setErro(null);
    try {
      const corpo =
        tipoNovaFonte === "arquivo"
          ? arquivoNovaFonte && { tipo: "arquivo" as const, nomeArquivo: arquivoNovaFonte.name, conteudoBase64: await lerArquivoComoDataUrl(arquivoNovaFonte) }
          : { tipo: tipoNovaFonte, conteudo: conteudoNovaFonte };

      if (!corpo || (tipoNovaFonte !== "arquivo" && !conteudoNovaFonte.trim())) {
        setErro(tipoNovaFonte === "arquivo" ? "Escolha um arquivo." : "Preencha o conteúdo da fonte.");
        return;
      }

      const resposta = await fetch(`/api/apuracao/${inicial.pauta.id}/fontes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        setErro(dados.erro ?? "Não foi possível adicionar a fonte.");
        return;
      }
      const fonte = await resposta.json();
      setFontes((atual) => [...atual, fonte]);
      setConteudoNovaFonte("");
      setArquivoNovaFonte(null);
    } catch {
      setErro("Não foi possível adicionar a fonte.");
    } finally {
      setAdicionandoFonte(false);
    }
  }

  async function removerFonte(id: string) {
    setFontes((atual) => atual.filter((f) => f.id !== id));
    try {
      await fetch(`/api/apuracao/fontes/${id}`, { method: "DELETE" });
    } catch {
      setErro("Não foi possível remover a fonte — recarregue a página.");
    }
  }

  async function enviarMensagem() {
    const texto = mensagemInput.trim();
    if (!texto || enviando) return;

    setMensagemInput("");
    setErro(null);
    setEnviando(true);
    setMensagens((atual) => [...atual, { id: `temp-${Date.now()}`, papel: "usuario", conteudo: texto, criadoEm: new Date().toISOString() }]);

    try {
      const resposta = await fetch(`/api/apuracao/${inicial.pauta.id}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: texto }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        setErro(dados.erro ?? "O agente não respondeu — tente de novo.");
        return;
      }
      const mensagemAgente = await resposta.json();
      setMensagens((atual) => [...atual, mensagemAgente]);
    } catch {
      setErro("O agente não respondeu — tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const dossieTemMudanca = dossie !== dossieSalvo;

  return (
    <main className="mx-auto flex h-[calc(100dvh-2rem)] max-w-6xl flex-col px-5 py-4">
      <div className="mb-4 flex-none">
        <Link href="/radar" className="text-xs font-bold text-neutral-500 hover:text-neutral-700">
          ← Radar de pautas
        </Link>
        <h1 className="mt-1 font-serif text-xl font-semibold text-neutral-900">{inicial.pauta.titulo}</h1>
        <p className="text-sm text-neutral-500">
          {inicial.pauta.fonteNome} ·{" "}
          <a href={inicial.pauta.urlOrigem} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:text-brand-700">
            Abrir fonte original ↗
          </a>
        </p>
      </div>

      {erro && (
        <p className="mb-3 flex-none rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-500" role="alert">
          {erro}
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <section className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wide text-neutral-500 uppercase">Dossiê</h2>
              {dossieTemMudanca && (
                <button
                  type="button"
                  onClick={salvarDossie}
                  disabled={salvandoDossie}
                  className="cursor-pointer rounded-md bg-brand-500 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {salvandoDossie ? "Salvando…" : "Salvar"}
                </button>
              )}
            </div>
            <textarea
              value={dossie}
              onChange={(e) => setDossie(e.target.value)}
              placeholder="O que já se sabe sobre essa pauta — vá escrevendo aqui, ou aceite trechos que o agente propuser na conversa."
              className="min-h-48 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[13.5px] leading-relaxed text-neutral-900 outline-none focus:border-brand-500 focus:bg-neutral-0"
            />
          </section>

          <section className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
            <h2 className="mb-3 text-xs font-bold tracking-wide text-neutral-500 uppercase">Fontes</h2>

            <div className="mb-3 flex flex-col gap-2">
              {fontes.length === 0 && <p className="text-xs text-neutral-400">Nenhuma fonte anexada ainda.</p>}
              {fontes.map((fonte) => (
                <div key={fonte.id} className="rounded-lg border border-neutral-200 p-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                        fonte.tipo === "nota" ? "bg-danger-50 text-danger-500" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {ROTULO_TIPO[fonte.tipo]}
                    </span>
                    <button type="button" onClick={() => removerFonte(fonte.id)} className="cursor-pointer text-[11px] font-bold text-neutral-400 hover:text-danger-500">
                      remover
                    </button>
                  </div>
                  {fonte.tipo === "link" ? (
                    <a href={fonte.conteudo} target="_blank" rel="noreferrer" className="block truncate text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                      {fonte.conteudo}
                    </a>
                  ) : fonte.tipo === "arquivo" ? (
                    <a href={fonte.arquivoUrl ?? "#"} target="_blank" rel="noreferrer" className="block truncate text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                      {fonte.conteudo}
                    </a>
                  ) : (
                    <p className="text-[12.5px] text-neutral-700">{fonte.conteudo}</p>
                  )}
                  {fonte.descricao && <p className="mt-0.5 text-[11.5px] text-neutral-500">{fonte.descricao}</p>}
                  {fonte.tipo === "nota" && <p className="mt-1 text-[10.5px] text-danger-500">Não verificado — não citar direto sem confirmar.</p>}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3">
              <div className="grid grid-cols-3 overflow-hidden rounded-md border border-neutral-200 text-xs font-bold">
                {(["link", "arquivo", "nota"] as TipoFonte[]).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoNovaFonte(tipo)}
                    className={`cursor-pointer py-1.5 transition-colors ${tipoNovaFonte === tipo ? "bg-brand-500 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                  >
                    {ROTULO_TIPO[tipo]}
                  </button>
                ))}
              </div>

              {tipoNovaFonte === "arquivo" ? (
                <input
                  type="file"
                  onChange={(e) => setArquivoNovaFonte(e.target.files?.[0] ?? null)}
                  className="w-full cursor-pointer text-xs text-neutral-600 file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-neutral-100 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-neutral-700 hover:file:bg-neutral-200"
                />
              ) : (
                <textarea
                  value={conteudoNovaFonte}
                  onChange={(e) => setConteudoNovaFonte(e.target.value)}
                  placeholder={tipoNovaFonte === "link" ? "https://..." : "O que você sabe, sem fonte formal ainda…"}
                  className="min-h-16 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-[13px] outline-none focus:border-brand-500 focus:bg-neutral-0"
                />
              )}

              <button
                type="button"
                onClick={adicionarFonte}
                disabled={adicionandoFonte}
                className="cursor-pointer rounded-md border border-neutral-200 py-1.5 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60"
              >
                {adicionandoFonte ? "Adicionando…" : "Adicionar fonte"}
              </button>
            </div>
          </section>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-neutral-200 bg-neutral-0">
          <div className="flex-none border-b border-neutral-200 px-4 py-3">
            <h2 className="text-xs font-bold tracking-wide text-neutral-500 uppercase">Conversa com o agente</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {mensagens.length === 0 && (
              <p className="py-10 text-center text-sm text-neutral-400">
                Peça pro agente resumir uma fonte, checar contradição, ou buscar mais informação na web.
              </p>
            )}
            <div className="flex flex-col gap-4">
              {mensagens.map((msg) => (
                <div key={msg.id} className={`flex ${msg.papel === "usuario" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                      msg.papel === "usuario" ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-900"
                    }`}
                  >
                    {msg.conteudo}
                  </div>
                </div>
              ))}
              {enviando && <div className="text-xs text-neutral-400">Agente está pensando…</div>}
            </div>
            <div ref={fimDaConversaRef} />
          </div>

          <div className="flex flex-none gap-2 border-t border-neutral-200 p-3">
            <textarea
              value={mensagemInput}
              onChange={(e) => setMensagemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensagem();
                }
              }}
              placeholder="Pergunte ou peça pra buscar algo…"
              className="min-h-11 flex-1 resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[14px] outline-none focus:border-brand-500 focus:bg-neutral-0"
            />
            <button
              type="button"
              onClick={enviarMensagem}
              disabled={enviando || !mensagemInput.trim()}
              className="cursor-pointer rounded-lg bg-brand-500 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-default disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
