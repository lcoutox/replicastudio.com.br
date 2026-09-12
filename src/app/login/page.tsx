"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: 20,
      }}
    >
      <form
        onSubmit={aoSubmeter}
        style={{
          width: 340,
          maxWidth: "100%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h1 style={{ fontSize: 18, margin: 0 }}>Replica Studio</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
          Senha
          <input
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 3, fontSize: 15 }}
          />
        </label>
        {erro && <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          style={{
            background: "var(--accent)",
            color: "var(--accent-contrast)",
            border: "none",
            borderRadius: 3,
            padding: 12,
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
