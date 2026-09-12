import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FonteSatori = {
  name: string;
  data: Buffer;
  weight: 400 | 700 | 800 | 900;
  style: "normal";
};

const DIR_FONTES = join(process.cwd(), "src/lib/render/fonts");

let cache: FonteSatori[] | null = null;

/**
 * Carrega as fontes usadas pelos templates, uma única vez por processo.
 *
 * São instâncias estáticas por peso (não fontes variáveis): o parser de fontes
 * do Satori (opentype.js) não sustenta o eixo de variação de largura+peso que o
 * Google Fonts usa hoje pra Noto Sans/Noto Serif (trava com "Cannot read
 * properties of undefined" ao ler a tabela fvar). Os arquivos .woff estáticos
 * vêm dos pacotes @fontsource/* (rodar `npm ls @fontsource/noto-sans` pra ver
 * a origem) — Satori lê ttf/otf/woff, não woff2.
 */
export function carregarFontes(): FonteSatori[] {
  if (cache) return cache;

  cache = [
    { name: "Archivo Black", data: readFileSync(join(DIR_FONTES, "ArchivoBlack-Regular.ttf")), weight: 400, style: "normal" },
    { name: "Noto Sans", data: readFileSync(join(DIR_FONTES, "NotoSans-Bold.woff")), weight: 700, style: "normal" },
    { name: "Noto Sans", data: readFileSync(join(DIR_FONTES, "NotoSans-ExtraBold.woff")), weight: 800, style: "normal" },
    { name: "Noto Serif", data: readFileSync(join(DIR_FONTES, "NotoSerif-Bold.woff")), weight: 700, style: "normal" },
    { name: "Noto Serif", data: readFileSync(join(DIR_FONTES, "NotoSerif-ExtraBold.woff")), weight: 800, style: "normal" },
  ];

  return cache;
}
