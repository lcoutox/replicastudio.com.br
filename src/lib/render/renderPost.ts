import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { BrandKit } from "@/lib/domain/brandKit";
import { DIMENSOES, type Tamanho } from "@/lib/domain/tamanho";
import { carregarFontes } from "./fonts";
import { FotoTemplate } from "./fotoTemplate";
import { CardTemplate } from "./cardTemplate";

export type DadosPostFoto = {
  tipo: "foto";
  tamanho: Tamanho;
  tag: string;
  manicheteRaw: string;
  imagemFundoDataUrl: string;
};

export type DadosPostCard = {
  tipo: "card";
  tamanho: Tamanho;
  rotulo: string;
  manchete: string;
  tema: "claro" | "escuro";
};

export type DadosPost = DadosPostFoto | DadosPostCard;

/**
 * Gera o PNG final a partir dos dados do formulário + brand kit. O tamanho
 * (feed 1080x1350 ou stories 1080x1920) vem de `dados.tamanho` — cada
 * template já sabe como se adaptar (ver fotoTemplate.tsx/cardTemplate.tsx).
 *
 * satori produz um SVG; @resvg/resvg-js rasteriza pra PNG. Os dois juntos
 * substituem o par Playwright (script Python) / html2canvas (protótipo em
 * Artifact) usados nas fases anteriores — mesma saída visual, sem headless
 * browser e sem os bugs de renderização do html2canvas no cliente.
 */
export async function renderizarPost(dados: DadosPost, brandKit: BrandKit): Promise<Buffer> {
  const { largura, altura } = DIMENSOES[dados.tamanho];

  const elemento =
    dados.tipo === "foto"
      ? FotoTemplate({
          tag: dados.tag,
          manicheteRaw: dados.manicheteRaw,
          imagemFundoDataUrl: dados.imagemFundoDataUrl,
          tamanho: dados.tamanho,
          brandKit,
        })
      : CardTemplate({
          rotulo: dados.rotulo,
          manchete: dados.manchete,
          tema: dados.tema,
          tamanho: dados.tamanho,
          brandKit,
        });

  const svg = await satori(elemento, {
    width: largura,
    height: altura,
    fonts: carregarFontes(),
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: largura },
  });
  const png = resvg.render();
  return png.asPng();
}
