import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // satori + @resvg/resvg-js usam bindings nativos — precisam rodar em runtime Node,
  // nunca no Edge Runtime.
  serverExternalPackages: ["@resvg/resvg-js"],
};

export default nextConfig;
