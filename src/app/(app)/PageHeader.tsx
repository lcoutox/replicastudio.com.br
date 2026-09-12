import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Cabeçalho de página compartilhado — mesmo padrão (voltar, selo de contexto,
 * título, subtítulo, ação) em todas as telas do app, em vez de cada página
 * montar seu próprio header do zero.
 */
export function PageHeader({
  voltar,
  eyebrow,
  title,
  subtitle,
  acao,
}: {
  voltar?: { href: string; label: string };
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {voltar && (
          <Link href={voltar.href} className="mb-1.5 inline-block text-xs font-bold text-neutral-500 hover:text-neutral-700">
            ← {voltar.label}
          </Link>
        )}
        {eyebrow && <div className="mb-0.5 text-xs font-bold tracking-wide text-brand-600 uppercase">{eyebrow}</div>}
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>}
      </div>
      {acao && <div className="flex-none">{acao}</div>}
    </div>
  );
}
