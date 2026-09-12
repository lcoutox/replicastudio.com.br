// Import de React "de verdade" de propósito — ver comentário em fotoTemplate.tsx.
import React, { type ReactNode } from "react";
import type { BrandKit } from "@/lib/domain/brandKit";
import { DIMENSOES, ZONA_SEGURA_STORIES, type Tamanho } from "@/lib/domain/tamanho";

export type CardTemplateProps = {
  rotulo: string;
  manchete: string;
  tema: "claro" | "escuro";
  tamanho: Tamanho;
  brandKit: BrandKit;
};

/**
 * Layout "card oficial": segue o brandbook à risca — sem foto, sem degradê,
 * rótulo com tracinho azul, manchete serif à esquerda, aspa decorativa azul de
 * apoio, assinatura no rodapé. Espelha replica/templates/post-card-solido.html.
 *
 * No Stories a composição desloca pra respeitar a zona segura (topo/base
 * cobertos pela interface do Instagram) — rótulo desce, manchete centraliza
 * verticalmente na área útil, assinatura sobe. No feed, mesmas coordenadas
 * de sempre.
 */
export function CardTemplate({ rotulo, manchete, tema, tamanho, brandKit }: CardTemplateProps): ReactNode {
  const claro = tema === "claro";
  const corFundo = claro ? brandKit.corCinza : brandKit.corPreto;
  const corTexto = claro ? brandKit.corPreto : brandKit.corBranco;
  const logo = claro ? brandKit.logoPositivoSvg : brandKit.logoNegativoSvg;
  const { largura, altura } = DIMENSOES[tamanho];

  const layout =
    tamanho === "feed"
      ? { rotuloTop: 90, manicheteTop: 460, aspaBottom: 300, rodapeBottom: 90 }
      : {
          rotuloTop: ZONA_SEGURA_STORIES.topo + 40,
          manicheteTop: Math.round((altura - ZONA_SEGURA_STORIES.topo - ZONA_SEGURA_STORIES.base) / 2) + ZONA_SEGURA_STORIES.topo - 80,
          aspaBottom: ZONA_SEGURA_STORIES.base + 210,
          rodapeBottom: ZONA_SEGURA_STORIES.base + 40,
        };

  return (
    <div
      style={{
        width: largura,
        height: altura,
        display: "flex",
        position: "relative",
        backgroundColor: corFundo,
        color: corTexto,
        fontFamily: brandKit.fonteRotulo,
      }}
    >
      <div style={{ position: "absolute", top: layout.rotuloTop, left: 90, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: brandKit.fonteRotulo, fontWeight: 800, fontSize: 30, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {rotulo}
        </div>
        <div style={{ display: "flex", width: 56, height: 6, background: brandKit.corAzul, marginTop: 14 }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 90,
          top: layout.manicheteTop,
          maxWidth: 660,
          display: "flex",
          fontFamily: brandKit.fonteManchetecard,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.08,
        }}
      >
        {manchete}
      </div>

      {/* viewBox original da aspa é 100 x 140 (razão ~0.714:1). */}
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(brandKit.aspaSvg).toString("base64")}`}
        width={240}
        height={336}
        style={{ position: "absolute", right: 90, bottom: layout.aspaBottom }}
      />

      <img
        src={`data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`}
        width={241}
        height={44}
        style={{ position: "absolute", left: 90, bottom: layout.rodapeBottom }}
      />
    </div>
  );
}
