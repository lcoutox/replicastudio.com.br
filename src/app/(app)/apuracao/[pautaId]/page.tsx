import { notFound } from "next/navigation";
import { getPautaPorId } from "@/lib/db/pautaRepository";
import { getOuCriarApuracao, getApuracaoCompleta } from "@/lib/db/apuracaoRepository";
import { ApuracaoClient, type ApuracaoView } from "./ApuracaoClient";

export const dynamic = "force-dynamic";

export default async function PaginaApuracao({ params }: { params: Promise<{ pautaId: string }> }) {
  const { pautaId } = await params;
  const pauta = await getPautaPorId(pautaId);
  if (!pauta) notFound();

  await getOuCriarApuracao(pautaId);
  const apuracao = await getApuracaoCompleta(pautaId);
  if (!apuracao) notFound();

  const view: ApuracaoView = {
    pauta: { id: pauta.id, titulo: pauta.titulo, resumo: pauta.resumo, urlOrigem: pauta.urlOrigem, fonteNome: pauta.fonte.nome },
    dossie: apuracao.dossie,
    fontes: apuracao.fontes.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      conteudo: f.conteudo,
      arquivoUrl: f.arquivoUrl,
      descricao: f.descricao,
      criadoEm: f.criadoEm.toISOString(),
    })),
    historico: apuracao.mensagens.map((m) => ({ id: m.id, papel: m.papel, conteudo: m.conteudo, aceito: m.aceito, criadoEm: m.criadoEm.toISOString() })),
  };

  return <ApuracaoClient inicial={view} />;
}
