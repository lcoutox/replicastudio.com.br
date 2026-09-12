"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { REPLICA_BRAND_KIT } from "@/lib/domain/brandKit";

export default function PaginaLogin() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!resposta.ok) {
        const dados = (await resposta.json()) as { erro?: string };
        setErro(dados.erro ?? "Não foi possível entrar.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <form onSubmit={aoSubmeter} className="flex w-[340px] max-w-full flex-col gap-5 rounded-xl border border-neutral-200 bg-neutral-0 p-8">
        <span
          className="h-6 w-auto text-neutral-900 [&_svg]:h-full [&_svg]:w-auto"
          dangerouslySetInnerHTML={{ __html: REPLICA_BRAND_KIT.logoPositivoSvg }}
          aria-label="Réplica"
          role="img"
        />
        <label className="flex flex-col gap-1.5 text-xs font-bold text-neutral-500">
          Senha
          <input
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[15px] text-neutral-900 outline-none transition-colors focus:border-brand-500 focus:bg-neutral-0"
          />
        </label>
        {erro && (
          <p className="text-sm text-danger-500" role="alert">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={carregando}
          className="cursor-pointer rounded-lg bg-brand-500 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-default disabled:opacity-70"
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
