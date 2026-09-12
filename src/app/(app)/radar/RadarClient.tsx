"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

  const pendentes = itens.filter((i) => i.status === "pendente" && (filtro === "todas" || i.fonte.categoria === filtro));
  const tratadas = itens.filter((i) => i.status !== "pendente" && (filtro === "todas" || i.fonte.categoria === filtro));

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 64px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>Radar de pautas</h1>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700 }}>
            ← Editor
          </Link>
          <Link href="/historico" style={{ fontSize: 13, fontWeight: 700 }}>
            Histórico
          </Link>
        </nav>
      </header>
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "0 0 22px" }}>
        Diário Oficial e licitações de Nova Serrana, via dados abertos da prefeitura.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            {pendentes.length > 0 ? `${pendentes.length} pauta${pendentes.length > 1 ? "s" : ""} pendente${pendentes.length > 1 ? "s" : ""}` : "Tudo revisado"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {ultimaAtualizacao ? `Última pauta encontrada: ${ultimaAtualizacao}` : "Ainda sem checagem"}
          </div>
        </div>
        <button
          type="button"
          onClick={dispararAtualizacao}
          disabled={atualizando}
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            border: "none",
            borderRadius: 3,
            padding: "11px 18px",
            fontWeight: 800,
            fontSize: 13.5,
            cursor: atualizando ? "default" : "pointer",
            opacity: atualizando ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {atualizando ? "Verificando fontes…" : "Atualizar agora"}
        </button>
      </div>

      {erro && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 16 }}>{erro}</p>}

      {fontes.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <button type="button" onClick={() => setFiltro("todas")} style={botaoFiltro(filtro === "todas")}>
            Todas as fontes
          </button>
          {fontes.map(([categoria, nome]) => (
            <button key={categoria} type="button" onClick={() => setFiltro(categoria)} style={botaoFiltro(filtro === categoria)}>
              {nome}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {itens.length === 0 && (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            Nenhuma pauta ainda — clique em &quot;Atualizar agora&quot; pra checar as fontes.
          </p>
        )}
        {itens.length > 0 && pendentes.length === 0 && (
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            Nenhuma pauta pendente com esse filtro.
          </p>
        )}
        {pendentes.map((item) => (
          <CardItem key={item.id} item={item} onMudarStatus={mudarStatus} />
        ))}
      </div>

      {tratadas.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setMostrarTratadas((v) => !v)}
            style={{ border: "none", background: "none", color: "var(--text-muted)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            {mostrarTratadas ? "Ocultar" : "Ver"} {tratadas.length} pauta{tratadas.length > 1 ? "s" : ""} já tratada{tratadas.length > 1 ? "s" : ""} →
          </button>
          {mostrarTratadas && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, opacity: 0.65 }}>
              {tratadas.map((item) => (
                <CardItem key={item.id} item={item} onMudarStatus={mudarStatus} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function CardItem({ item, onMudarStatus }: { item: PautaView; onMudarStatus: (id: string, status: PautaView["status"]) => void }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {item.status === "pendente" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flex: "none" }} />}
        <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
          {item.fonte.nome}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>· {formatoData.format(new Date(item.descobertoEm))}</span>
        {item.pontuacao !== null && (
          <span
            title="Pontuação de relevância (Haiku) — prioridade sugerida, não é filtro definitivo."
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: item.pontuacao >= 5 ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${item.pontuacao >= 5 ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 10,
              padding: "1px 7px",
            }}
          >
            {item.pontuacao}/10
          </span>
        )}
        {item.status === "apuracao" && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "var(--accent)" }}>EM APURAÇÃO</span>}
        {item.status === "dispensada" && (
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "var(--text-muted)" }}>
            {item.descarteAutomatico ? "DESCARTE AUTOMÁTICO" : "DISPENSADA"}
          </span>
        )}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginBottom: 6 }}>{item.titulo}</div>
      {item.resumo && <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 12px" }}>{item.resumo}</p>}
      {item.categorias.length > 0 && (
        <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "0 0 12px" }}>Editoria: {item.categorias.join(", ")}</p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {item.status === "pendente" && (
          <>
            <button type="button" onClick={() => onMudarStatus(item.id, "apuracao")} style={botaoAcao(true)}>
              Mover pra apuração
            </button>
            <button type="button" onClick={() => onMudarStatus(item.id, "dispensada")} style={botaoAcao(false)}>
              Dispensar
            </button>
          </>
        )}
        <a href={item.urlOrigem} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700 }}>
          Abrir fonte ↗
        </a>
      </div>
    </div>
  );
}

function botaoFiltro(ativo: boolean): React.CSSProperties {
  return {
    border: `1px solid ${ativo ? "var(--accent)" : "var(--border)"}`,
    background: ativo ? "#eef1ff" : "var(--surface)",
    color: ativo ? "var(--accent)" : "var(--text-muted)",
    borderRadius: 20,
    padding: "6px 13px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
  };
}

function botaoAcao(primario: boolean): React.CSSProperties {
  return {
    border: primario ? "none" : "1px solid var(--border)",
    background: primario ? "var(--accent)" : "var(--surface)",
    color: primario ? "var(--accent-contrast)" : "var(--text-muted)",
    borderRadius: 3,
    padding: "8px 13px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
  };
}
