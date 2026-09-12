import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // satori + @resvg/resvg-js usam bindings nativos — precisam rodar em runtime Node,
  // nunca no Edge Runtime. pdf-parse (via pdfjs-dist) quebra quando o webpack do
  // Next tenta empacotar ("Object.defineProperty called on non-object") — precisa
  // rodar via require() nativo do Node em vez de ser bundlado.
  serverExternalPackages: ["@resvg/resvg-js", "pdf-parse"],
};

export default nextConfig;
