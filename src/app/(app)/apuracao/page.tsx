import Link from "next/link";
import { listarPautasEmApuracao } from "@/lib/db/pautaRepository";
import { PageHeader } from "../PageHeader";

export const dynamic = "force-dynamic";

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function PaginaSalasApuracao() {
  const pautas = await listarPautasEmApuracao();

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader title="Salas de apuração" subtitle="Pautas em investigação agora — abra pra continuar de onde parou." />

      {pautas.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-0 px-6 py-14 text-center">
          <p className="mb-3 text-sm text-neutral-500">Nenhuma sala aberta ainda.</p>
          <Link href="/radar" className="text-sm font-bold text-brand-600 hover:text-brand-700">
            Ir pro radar de pautas →
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {pautas.map((pauta) => (
          <li key={pauta.id}>
            <Link
              href={`/apuracao/${pauta.id}`}
              className="block rounded-xl border border-neutral-200 bg-neutral-0 p-4 transition-shadow hover:shadow-sm"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wide text-neutral-500 uppercase">{pauta.fonte.nome}</span>
                {pauta.apuracao && <span className="text-[11px] text-neutral-400">· atividade {formatoData.format(pauta.apuracao.atualizadoEm)}</span>}
              </div>
              <div className="text-[15px] font-bold text-neutral-900">{pauta.titulo}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
