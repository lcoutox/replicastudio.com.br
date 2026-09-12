import { PrismaClient } from "@prisma/client";
import { REPLICA_BRAND_KIT } from "../src/lib/domain/brandKit";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: "workspace-replica" },
    update: {},
    create: { id: "workspace-replica", nome: "Réplica" },
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

  console.log("Seed concluído: workspace e brand kit da Réplica prontos.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
