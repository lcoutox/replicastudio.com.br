"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { REPLICA_BRAND_KIT } from "@/lib/domain/brandKit";

const ITENS_NAV = [
  { href: "/", label: "Editor" },
  { href: "/radar", label: "Radar de pautas" },
  { href: "/historico", label: "Histórico" },
];

export function TopNav() {
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
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-0/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-3">
        <div className="flex items-center gap-8">
          <span
            className="h-5 w-auto text-neutral-900 [&_svg]:h-full [&_svg]:w-auto"
            dangerouslySetInnerHTML={{ __html: REPLICA_BRAND_KIT.logoPositivoSvg }}
            aria-label="Réplica"
            role="img"
          />
          <nav className="flex items-center gap-1">
            {ITENS_NAV.map((item) => {
              const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    ativo ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-default disabled:opacity-60"
        >
          {saindo ? "Saindo…" : "Sair"}
        </button>
      </div>
    </header>
  );
}
