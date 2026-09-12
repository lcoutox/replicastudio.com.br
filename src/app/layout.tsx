import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Replica Studio",
  description: "Gerador de posts para redes sociais da Réplica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
