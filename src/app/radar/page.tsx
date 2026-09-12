import { listarPautas } from "@/lib/db/pautaRepository";
import { RadarClient, type PautaView } from "./RadarClient";

export const dynamic = "force-dynamic";

export default async function PaginaRadar() {
  const pautas = await listarPautas();

  const pautasView: PautaView[] = pautas.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    resumo: p.resumo,
    urlOrigem: p.urlOrigem,
    status: p.status,
    descobertoEm: p.descobertoEm.toISOString(),
    pontuacao: p.pontuacao,
    categorias: p.categorias,
    descarteAutomatico: p.descarteAutomatico,
    fonte: { nome: p.fonte.nome, categoria: p.fonte.categoria },
  }));

  return <RadarClient pautasIniciais={pautasView} />;
}
