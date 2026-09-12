"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PautaView = {
  id: string;
  titulo: string;
  resumo: string | null;
  urlOrigem: string;
  status: "pendente" | "apuracao" | "dispensada";
  descobertoEm: string;
  pontuacao: number | null;
  categorias: string[];
  descarteAutomatico: boolean;
  fonte: { nome: string; categoria: string };
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const LIMIAR_RELEVANTE = 5;

export function RadarClient({ pautasIniciais }: { pautasIniciais: PautaView[] }) {
  const [itens, setItens] = useState(pautasIniciais);
  const [filtro, setFiltro] = useState<string>("todas");
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarTratadas, setMostrarTratadas] = useState(false);

  const fontes = useMemo(() => {
    const vistas = new Map<string, string>();
    for (const item of itens) vistas.set(item.fonte.categoria, item.fonte.nome);
    return Array.from(vistas.entries());
  }, [itens]);

  const ultimaAtualizacao = useMemo(() => {
    if (itens.length === 0) return null;
    const maisRecente = itens.map((item) => item.descobertoEm).reduce((max, atual) => (atual > max ? atual : max));
    return formatoData.format(new Date(maisRecente));
  }, [itens]);

  async function dispararAtualizacao() {
    setAtualizando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/radar/atualizar", { method: "POST" });
      if (!resposta.ok) throw new Error();
      const dados = (await resposta.json()) as {
        pautas: PautaView[];
        resultados: { fonte: string; novasPautas: number; falhasClassificacao: number; erro?: string }[];
      };
      setItens(dados.pautas);
      const comErro = dados.resultados.filter((r) => r.erro);
      const comFalhaClassificacao = dados.resultados.filter((r) => r.falhasClassificacao > 0);
      if (comErro.length > 0) {
        setErro(`Falha ao checar: ${comErro.map((r) => r.fonte).join(", ")}. As outras fontes foram atualizadas normalmente.`);
      } else if (comFalhaClassificacao.length > 0) {
        const total = comFalhaClassificacao.reduce((soma, r) => soma + r.falhasClassificacao, 0);
        setErro(`${total} item${total > 1 ? "s" : ""} não pôde ser classificado e ficou de fora dessa checagem — tente atualizar de novo.`);
      }
    } catch {
      setErro("Não foi possível atualizar o radar agora.");
    } finally {
      setAtualizando(false);
    }
  }

  async function mudarStatus(id: string, status: PautaView["status"]) {
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      const resposta = await fetch(`/api/radar/pautas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!resposta.ok) throw new Error();
    } catch {
      setErro("Não foi possível salvar essa mudança — tente de novo.");
    }
  }

  const combinaFiltro = (i: PautaView) => filtro === "todas" || i.fonte.categoria === filtro;
  const pendentes = itens.filter((i) => i.status === "pendente" && combinaFiltro(i));
  const emApuracao = itens.filter((i) => i.status === "apuracao" && combinaFiltro(i));
  const dispensadas = itens.filter((i) => i.status === "dispensada" && combinaFiltro(i));

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-1 font-serif text-2xl font-semibold text-neutral-900">Radar de pautas</h1>
      <p className="mb-6 text-sm text-neutral-500">Diário Oficial e licitações de Nova Serrana, via dados abertos da prefeitura.</p>

      <div className="mb-3 flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-4">
        <div>
          <div className="text-[15px] font-bold text-neutral-900">
            {pendentes.length > 0
              ? `${pendentes.length} pauta${pendentes.length > 1 ? "s" : ""} pendente${pendentes.length > 1 ? "s" : ""}`
              : "Tudo revisado"}
          </div>
          <div className="text-xs text-neutral-500">{ultimaAtualizacao ? `Última pauta encontrada: ${ultimaAtualizacao}` : "Ainda sem checagem"}</div>
        </div>
        <button
          type="button"
          onClick={dispararAtualizacao}
          disabled={atualizando}
          className="cursor-pointer rounded-lg bg-brand-500 px-4.5 py-2.5 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-brand-600 disabled:cursor-default disabled:opacity-70"
        >
          {atualizando ? "Verificando fontes…" : "Atualizar agora"}
        </button>
      </div>

      {erro && (
        <p className="mb-4 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-500" role="alert">
          {erro}
        </p>
      )}

      {fontes.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <FiltroChip label="Todas as fontes" ativo={filtro === "todas"} onClick={() => setFiltro("todas")} />
          {fontes.map(([categoria, nome]) => (
            <FiltroChip key={categoria} label={nome} ativo={filtro === categoria} onClick={() => setFiltro(categoria)} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {itens.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-0 px-6 py-14 text-center">
            <p className="text-sm text-neutral-500">Nenhuma pauta ainda — clique em &quot;Atualizar agora&quot; pra checar as fontes.</p>
          </div>
        )}
        {itens.length > 0 && pendentes.length === 0 && emApuracao.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-0 px-6 py-14 text-center">
            <p className="text-sm text-neutral-500">Nenhuma pauta pendente com esse filtro.</p>
          </div>
        )}
        {pendentes.map((item) => (
          <CardItem key={item.id} item={item} onMudarStatus={mudarStatus} />
        ))}
      </div>

      {emApuracao.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2.5 text-xs font-bold tracking-wide text-neutral-500 uppercase">
            Em apuração ({emApuracao.length})
          </h2>
          <div className="flex flex-col gap-2.5">
            {emApuracao.map((item) => (
              <CardItem key={item.id} item={item} onMudarStatus={mudarStatus} />
            ))}
          </div>
        </div>
      )}

      {dispensadas.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setMostrarTratadas((v) => !v)}
            className="cursor-pointer text-xs font-bold text-neutral-500 hover:text-neutral-700"
          >
            {mostrarTratadas ? "Ocultar" : "Ver"} {dispensadas.length} pauta{dispensadas.length > 1 ? "s" : ""} dispensada{dispensadas.length > 1 ? "s" : ""} →
          </button>
          {mostrarTratadas && (
            <div className="mt-3 flex flex-col gap-2.5 opacity-60">
              {dispensadas.map((item) => (
                <CardItem key={item.id} item={item} onMudarStatus={mudarStatus} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function FiltroChip({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
        ativo ? "border-brand-500 bg-brand-50 text-brand-700" : "border-neutral-200 bg-neutral-0 text-neutral-500 hover:border-neutral-300"
      }`}
    >
      {label}
    </button>
  );
}

function CardItem({ item, onMudarStatus }: { item: PautaView; onMudarStatus: (id: string, status: PautaView["status"]) => void }) {
  const relevante = item.pontuacao !== null && item.pontuacao >= LIMIAR_RELEVANTE;

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {item.status === "pendente" && <span className="h-1.5 w-1.5 flex-none rounded-full bg-brand-500" aria-hidden />}
        <span className="text-[11px] font-extrabold tracking-wide text-neutral-500 uppercase">{item.fonte.nome}</span>
        <span className="text-[11px] text-neutral-400">· {formatoData.format(new Date(item.descobertoEm))}</span>
        {item.pontuacao !== null && (
          <span
            title="Pontuação de relevância (Haiku) — prioridade sugerida, não é filtro definitivo."
            className={`rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${
              relevante ? "border-brand-200 bg-brand-50 text-brand-700" : "border-neutral-200 text-neutral-400"
            }`}
          >
            {item.pontuacao}/10
          </span>
        )}
        {item.status === "apuracao" && (
          <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-extrabold text-brand-700">EM APURAÇÃO</span>
        )}
        {item.status === "dispensada" && (
          <span className="ml-auto text-[11px] font-extrabold text-neutral-400">
            {item.descarteAutomatico ? "DESCARTE AUTOMÁTICO" : "DISPENSADA"}
          </span>
        )}
      </div>

      <div className="mb-1.5 text-[15px] leading-snug font-bold text-neutral-900">{item.titulo}</div>
      {item.resumo && <p className="mb-3 text-[13px] leading-relaxed text-neutral-600">{item.resumo}</p>}
      {item.categorias.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {item.categorias.map((categoria) => (
            <span key={categoria} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {categoria}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        {item.status === "pendente" && (
          <>
            <button
              type="button"
              onClick={() => onMudarStatus(item.id, "apuracao")}
              className="cursor-pointer rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600"
            >
              Mover pra apuração
            </button>
            <button
              type="button"
              onClick={() => onMudarStatus(item.id, "dispensada")}
              className="cursor-pointer rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              Dispensar
            </button>
          </>
        )}
        {item.status === "apuracao" && (
          <Link href={`/apuracao/${item.id}`} className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600">
            Abrir sala de apuração →
          </Link>
        )}
        <a href={item.urlOrigem} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-600 hover:text-brand-700">
          Abrir fonte ↗
        </a>
      </div>
    </div>
  );
}
