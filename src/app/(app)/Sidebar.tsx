"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { REPLICA_BRAND_KIT, ASPA_AZUL_SVG } from "@/lib/domain/brandKit";

// Mesmos termos usados pra descrever o fluxo editorial (radar -> apuração ->
// redação -> artes) — uma palavra cada, sem qualificador redundante.
const ITENS_NAV = [
  { href: "/", label: "Artes", icone: IconeEditor },
  { href: "/radar", label: "Radar", icone: IconeRadar },
  { href: "/apuracao", label: "Apuração", icone: IconeApuracao },
  { href: "/historico", label: "Histórico", icone: IconeHistorico },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-16 flex-none flex-col border-r border-neutral-200 bg-neutral-0 md:w-56">
      <div className="flex h-16 items-center border-b border-neutral-200 px-3 md:px-5">
        <span
          className="hidden h-5 w-auto text-neutral-900 md:block md:[&_svg]:h-full md:[&_svg]:w-auto"
          dangerouslySetInnerHTML={{ __html: REPLICA_BRAND_KIT.logoPositivoSvg }}
          aria-label="Réplica"
          role="img"
        />
        <span
          className="mx-auto h-6 w-auto text-brand-500 md:hidden [&_svg]:h-full [&_svg]:w-auto"
          dangerouslySetInnerHTML={{ __html: ASPA_AZUL_SVG }}
          aria-label="Réplica"
          role="img"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {ITENS_NAV.map((item) => {
          const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icone = item.icone;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              title={item.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                ativo ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icone className="h-5 w-5 flex-none" />
              <span className="hidden truncate md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-2 md:p-3">
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          title="Sair"
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-default disabled:opacity-60"
        >
          <IconeSair className="h-5 w-5 flex-none" />
          <span className="hidden md:inline">{saindo ? "Saindo…" : "Sair"}</span>
        </button>
      </div>
    </aside>
  );
}

type IconeProps = { className?: string };

function IconeEditor({ className }: IconeProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="M3 15l4.5-4.5a1.5 1.5 0 0 1 2.12 0L14 14.9M13 14l2.5-2.5a1.5 1.5 0 0 1 2.12 0L21 15" />
    </svg>
  );
}

function IconeRadar({ className }: IconeProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 12 L18.5 6.5" />
    </svg>
  );
}

function IconeApuracao({ className }: IconeProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconeHistorico({ className }: IconeProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconeSair({ className }: IconeProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M14 12H4" />
    </svg>
  );
}
