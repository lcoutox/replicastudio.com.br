import { PrismaClient } from "@prisma/client";
import { REPLICA_BRAND_KIT } from "../src/lib/domain/brandKit";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: "workspace-replica" },
    update: {},
    create: {
      id: "workspace-replica",
      nome: "Réplica",
      // Foco editorial por abrangência — ver src/lib/domain/linhaEditorial.ts.
      // Usado pra pontuar pauta no radar: fora do foco declarado pontua baixo
      // mesmo sendo "notícia" em tese.
      linhaEditorial: [
        { escopo: "nova-serrana", editoriasPrioritarias: ["politica", "saude", "cultura"] },
        { escopo: "nacional", editoriasPrioritarias: ["politica", "economia"] },
      ],
    },
  });

  await prisma.brandKit.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      corAzul: REPLICA_BRAND_KIT.corAzul,
      corPreto: REPLICA_BRAND_KIT.corPreto,
      corBranco: REPLICA_BRAND_KIT.corBranco,
      corCinza: REPLICA_BRAND_KIT.corCinza,
      logoPositivoSvg: REPLICA_BRAND_KIT.logoPositivoSvg,
      logoNegativoSvg: REPLICA_BRAND_KIT.logoNegativoSvg,
      aspaSvg: REPLICA_BRAND_KIT.aspaSvg,
      fonteManchetefoto: REPLICA_BRAND_KIT.fonteManchetefoto,
      fonteRotulo: REPLICA_BRAND_KIT.fonteRotulo,
      fonteManchetecard: REPLICA_BRAND_KIT.fonteManchetecard,
    },
  });

  // Fontes reais de Nova Serrana confirmadas em 2026-09-12 (ver
  // monitoramento/fontes.yaml no repo `replica`) — a prefeitura expõe dados
  // abertos estruturados pra várias categorias, não só Diário Oficial.
  await prisma.fonte.upsert({
    where: { categoria: "diario-oficial" },
    update: {},
    create: {
      nome: "Diário Oficial de Nova Serrana",
      categoria: "diario-oficial",
      escopo: "nova-serrana",
      estrategia: "api_json",
      urlApi: "https://www.novaserrana.mg.gov.br/portal/dados-abertos/diario-oficial/2026",
      urlPagina: "https://www.novaserrana.mg.gov.br/portal/diario-oficial",
    },
  });

  await prisma.fonte.upsert({
    where: { categoria: "licitacoes" },
    update: {},
    create: {
      nome: "Licitações — Prefeitura de Nova Serrana",
      categoria: "licitacoes",
      escopo: "nova-serrana",
      estrategia: "api_json",
      urlApi: "https://www.novaserrana.mg.gov.br/portal/dados-abertos/licitacoes/2026",
      urlPagina: "https://www.novaserrana.mg.gov.br/portal/editais/1",
    },
  });

  console.log("Seed concluído: workspace, brand kit e fontes do radar prontos.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
