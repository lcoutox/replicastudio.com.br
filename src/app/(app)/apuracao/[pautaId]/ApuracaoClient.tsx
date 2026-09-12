"use client";

import { useState } from "react";
import { PageHeader } from "../../PageHeader";

type TipoFonte = "link" | "arquivo" | "nota";

export type ApuracaoView = {
  pauta: { id: string; titulo: string; resumo: string | null; urlOrigem: string; fonteNome: string };
  dossie: string;
  fontes: { id: string; tipo: TipoFonte; conteudo: string; arquivoUrl: string | null; descricao: string | null; criadoEm: string }[];
  historico: { id: string; papel: "usuario" | "agente"; conteudo: string; aceito: boolean | null; criadoEm: string }[];
};

const ROTULO_TIPO: Record<TipoFonte, string> = { link: "Link", arquivo: "Arquivo", nota: "Nota sem fonte" };

const ACOES_RAPIDAS = [
  { label: "Resumir fontes", pedido: "Resuma as fontes já anexadas num trecho pronto pra entrar no dossiê." },
  {
    label: "Buscar fontes na web",
    pedido: "Busque na web se há fontes (notícias, documentos oficiais, redes sociais) sobre esta pauta e escreva um trecho pronto pra entrar no dossiê, com citação de cada fonte usada.",
  },
  {
    label: "Verificar contradições",
    pedido: "Compare as fontes anexadas, o texto original da fonte e o dossiê atual — aponte contradições ou lacunas, em texto pronto pra entrar no dossiê.",
  },
];

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

  const [historico, setHistorico] = useState(inicial.historico);
  const [pedido, setPedido] = useState("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [sugestaoPendente, setSugestaoPendente] = useState<{ id: string; conteudo: string } | null>(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const [erro, setErro] = useState<string | null>(null);

  const dossieTemMudanca = dossie !== dossieSalvo;

  async function salvarDossie(textoParaSalvar = dossie) {
    setSalvandoDossie(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/apuracao/${inicial.pauta.id}/dossie`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossie: textoParaSalvar }),
      });
      if (!resposta.ok) throw new Error();
      setDossie(textoParaSalvar);
      setDossieSalvo(textoParaSalvar);
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

  async function enviarPedido(textoForcado?: string) {
    const texto = (textoForcado ?? pedido).trim();
    if (!texto || enviandoPedido) return;

    if (!textoForcado) setPedido("");
    setErro(null);
    setEnviandoPedido(true);
    setSugestaoPendente(null);

    try {
      const resposta = await fetch(`/api/apuracao/${inicial.pauta.id}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: texto, dossieAtual: dossie }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        setErro(dados.erro ?? "O agente não respondeu — tente de novo.");
        return;
      }
      const mensagemSugestao = await resposta.json();
      setSugestaoPendente({ id: mensagemSugestao.id, conteudo: mensagemSugestao.conteudo });
      setHistorico((atual) => [
        ...atual,
        { id: `pedido-${Date.now()}`, papel: "usuario", conteudo: texto, aceito: null, criadoEm: new Date().toISOString() },
        { ...mensagemSugestao, aceito: null },
      ]);
    } catch {
      setErro("O agente não respondeu — tente de novo.");
    } finally {
      setEnviandoPedido(false);
    }
  }

  async function aceitarSugestao() {
    if (!sugestaoPendente) return;
    const novoDossie = dossie.trim() ? `${dossie.trim()}\n\n${sugestaoPendente.conteudo}` : sugestaoPendente.conteudo;
    await salvarDossie(novoDossie);
    await marcarSugestao(sugestaoPendente.id, true);
    setSugestaoPendente(null);
  }

  async function descartarSugestao() {
    if (!sugestaoPendente) return;
    await marcarSugestao(sugestaoPendente.id, false);
    setSugestaoPendente(null);
  }

  async function marcarSugestao(mensagemId: string, aceito: boolean) {
    setHistorico((atual) => atual.map((m) => (m.id === mensagemId ? { ...m, aceito } : m)));
    try {
      await fetch(`/api/apuracao/mensagens/${mensagemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceito }),
      });
    } catch {
      setErro("Não foi possível registrar essa decisão — recarregue a página.");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <PageHeader
        voltar={{ href: "/apuracao", label: "Apuração" }}
        eyebrow={inicial.pauta.fonteNome}
        title={inicial.pauta.titulo}
        subtitle={
          <a href={inicial.pauta.urlOrigem} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:text-brand-700">
            Abrir fonte original ↗
          </a>
        }
      />

      {erro && (
        <p className="mb-4 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-500" role="alert">
          {erro}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_1fr]">
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

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wide text-neutral-500 uppercase">Dossiê</h2>
              {dossieTemMudanca && (
                <button
                  type="button"
                  onClick={() => salvarDossie()}
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
              placeholder="O que já se sabe sobre essa pauta — escreva aqui, ou peça ajuda ao agente abaixo e aceite o que fizer sentido."
              className="min-h-80 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-brand-500 focus:bg-neutral-0"
            />
          </section>

          <section className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
            <h2 className="mb-3 text-xs font-bold tracking-wide text-neutral-500 uppercase">Peça ajuda ao agente</h2>

            <div className="mb-3 flex flex-wrap gap-2">
              {ACOES_RAPIDAS.map((acao) => (
                <button
                  key={acao.label}
                  type="button"
                  onClick={() => enviarPedido(acao.pedido)}
                  disabled={enviandoPedido}
                  className="cursor-pointer rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-default disabled:opacity-60"
                >
                  {acao.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    enviarPedido();
                  }
                }}
                placeholder="Ex.: resuma o que sabemos até agora sobre X…"
                className="min-h-11 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[14px] outline-none focus:border-brand-500 focus:bg-neutral-0"
              />
              <button
                type="button"
                onClick={() => enviarPedido()}
                disabled={enviandoPedido || !pedido.trim()}
                className="cursor-pointer rounded-lg bg-brand-500 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-default disabled:opacity-60"
              >
                {enviandoPedido ? "Pensando…" : "Pedir"}
              </button>
            </div>

            {sugestaoPendente && (
              <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3.5">
                <div className="mb-2 text-[11px] font-extrabold tracking-wide text-brand-700 uppercase">Sugestão do agente</div>
                <p className="mb-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-neutral-800">{sugestaoPendente.conteudo}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={aceitarSugestao}
                    className="cursor-pointer rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                  >
                    Aceitar no dossiê
                  </button>
                  <button
                    type="button"
                    onClick={descartarSugestao}
                    className="cursor-pointer rounded-md border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}
          </section>

          {historico.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setMostrarHistorico((v) => !v)}
                className="cursor-pointer text-xs font-bold text-neutral-500 hover:text-neutral-700"
              >
                {mostrarHistorico ? "Ocultar" : "Ver"} histórico de pedidos ao agente ({historico.filter((m) => m.papel === "usuario").length}) →
              </button>
              {mostrarHistorico && (
                <div className="mt-3 flex flex-col gap-2.5">
                  {historico.map((item) => (
                    <div key={item.id} className="rounded-lg border border-neutral-200 bg-neutral-0 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[11px] font-extrabold tracking-wide text-neutral-500 uppercase">
                          {item.papel === "usuario" ? "Pedido" : "Sugestão"}
                        </span>
                        {item.papel === "agente" && item.aceito !== null && (
                          <span className={`text-[11px] font-bold ${item.aceito ? "text-success-500" : "text-neutral-400"}`}>
                            {item.aceito ? "aceita" : "descartada"}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-neutral-700">{item.conteudo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
