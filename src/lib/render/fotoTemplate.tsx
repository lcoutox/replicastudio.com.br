// Import de React "de verdade" (não só o tipo) de propósito: o Next.js
// reescreve "jsx" do tsconfig pra "preserve" a cada build (ele faz seu
// próprio transform via SWC nesse modo), e nesse modo o JSX vira
// React.createElement(...) — sem este import, scripts standalone rodados via
// tsx/esbuild (ex.: scripts/smoke-test-render.ts) quebram com "React is not
// defined". Com o import presente, funciona nos dois pipelines de build.
import React, { type ReactNode } from "react";
import type { BrandKit } from "@/lib/domain/brandKit";
import { analisarDestaque } from "@/lib/domain/highlightedText";
import { DIMENSOES, ZONA_SEGURA_STORIES, type Tamanho } from "@/lib/domain/tamanho";

export type FotoTemplateProps = {
  tag: string;
  manicheteRaw: string;
  imagemFundoDataUrl: string;
  tamanho: Tamanho;
  brandKit: BrandKit;
};

/**
 * Layout "notícia com foto": imagem de fundo, degradê preto só na base (meio-termo
 * testado com o usuário — nem tão sutil quanto a v2, nem tão pesado quanto a v1),
 * chamada em chip azul, manchete em caixa alta com grifo opcional, logo discreto.
 *
 * No Stories, o bloco de texto sobe pra ficar acima da zona segura da base
 * (caixa de resposta do Instagram cobre os últimos ~320px) — ver
 * docs/PRD.md e src/lib/domain/tamanho.ts. Fora isso, mesmo desenho do feed.
 *
 * Espelha exatamente replica/templates/post-noticia-foto.html — qualquer ajuste
 * visual feito lá deveria ser replicado aqui (e vice-versa) até o dia em que o
 * template HTML/Playwright for aposentado em favor deste.
 */
export function FotoTemplate({ tag, manicheteRaw, imagemFundoDataUrl, tamanho, brandKit }: FotoTemplateProps): ReactNode {
  const segmentos = analisarDestaque(manicheteRaw);
  const { largura, altura } = DIMENSOES[tamanho];

  // No Stories a margem de segurança (320px) já empurra o bloco de texto pra
  // cima — usar só mais 48px de respiro em cima disso (como no feed) deixava
  // uma faixa preta vazia grande e sem função visual entre o texto e a borda.
  // Reduzindo o respiro e alongando o degradê/fonte pro tamanho do canvas o
  // conjunto ocupa melhor os 1920px de altura em vez de "flutuar" no meio.
  const ehStories = tamanho === "stories";
  const paddingBase = ehStories ? ZONA_SEGURA_STORIES.base + 24 : 48;
  const alturaGradiente = ehStories ? "48%" : "52%";
  const fontSizeManchete = ehStories ? 84 : 72;
  const fontSizeTag = ehStories ? 26 : 24;

  return (
    <div
      style={{
        width: largura,
        height: altura,
        display: "flex",
        position: "relative",
        backgroundColor: brandKit.corCinza,
        fontFamily: brandKit.fonteRotulo,
      }}
    >
      <img
        src={imagemFundoDataUrl}
        width={largura}
        height={altura}
        style={{ position: "absolute", inset: 0, objectFit: "cover" }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: alturaGradiente,
          display: "flex",
          background:
            "linear-gradient(to bottom, rgba(18,18,18,0) 0%, rgba(18,18,18,0.6) 32%, rgba(18,18,18,0.92) 65%, rgba(18,18,18,0.98) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          padding: `0 64px ${paddingBase}px`,
          color: brandKit.corBranco,
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: brandKit.corAzul,
            color: brandKit.corBranco,
            fontFamily: brandKit.fonteRotulo,
            fontWeight: 800,
            fontSize: fontSizeTag,
            letterSpacing: 1,
            padding: "10px 18px",
            marginBottom: 22,
          }}
        >
          {tag}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            // columnGap/rowGap (não o shorthand "gap", que o Satori ignora
            // silenciosamente) substituem o espaço que se perderia nas bordas de
            // cada <span> — Satori/Yoga tratam cada filho flex como caixa
            // isolada e comem o espaço nas pontas do texto. O texto de cada
            // segmento é exibido já sem espaço nas pontas (.trim()) e o gap
            // devolve um espaço visual entre segmentos vizinhos.
            columnGap: 16,
            rowGap: 8,
            fontFamily: brandKit.fonteManchetefoto,
            fontWeight: 400,
            fontSize: fontSizeManchete,
            lineHeight: 1,
            letterSpacing: -0.5,
            textTransform: "uppercase",
            maxWidth: 952,
            marginBottom: 28,
          }}
        >
          {segmentos.map((seg, i) =>
            seg.destaque ? (
              <span key={i} style={{ display: "flex", background: brandKit.corAzul, padding: "0 10px" }}>
                {seg.texto.trim()}
              </span>
            ) : (
              <span key={i} style={{ display: "flex" }}>
                {seg.texto.trim()}
              </span>
            ),
          )}
        </div>

        {/* viewBox original do logo é 767.7 x 140 (razão ~5.48:1) — satori exige
            width e height explícitos em toda <img>, não calcula a partir do SVG. */}
        <img src={dataUrlSvg(brandKit.logoNegativoSvg)} width={121} height={22} style={{ opacity: 0.92 }} />
      </div>
    </div>
  );
}

export function dataUrlSvg(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
