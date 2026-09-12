import type { BrandKit as BrandKitDb } from "@prisma/client";
import { prisma } from "./prisma";
import { REPLICA_BRAND_KIT, type BrandKit } from "@/lib/domain/brandKit";

const NOME_WORKSPACE_UNICO = "Réplica";

function paraDominio(registro: BrandKitDb): BrandKit {
  return {
    corAzul: registro.corAzul,
    corPreto: registro.corPreto,
    corBranco: registro.corBranco,
    corCinza: registro.corCinza,
    logoPositivoSvg: registro.logoPositivoSvg,
    logoNegativoSvg: registro.logoNegativoSvg,
    aspaSvg: registro.aspaSvg,
    fonteManchetefoto: registro.fonteManchetefoto,
    fonteRotulo: registro.fonteRotulo,
    fonteManchetecard: registro.fonteManchetecard,
  };
}

/**
 * v1 tem um workspace só. Busca (ou cria, se o seed ainda não rodou) o
 * workspace único e devolve seu brand kit. Quando existir mais de um
 * workspace, esta função vira "getBrandKitDoWorkspace(id)".
 */
export async function getWorkspaceUnico(): Promise<{ id: string }> {
  const existente = await prisma.workspace.findFirst({ where: { nome: NOME_WORKSPACE_UNICO } });
  if (existente) return existente;
  return prisma.workspace.create({ data: { nome: NOME_WORKSPACE_UNICO } });
}

export async function getBrandKitAtivo(): Promise<BrandKit> {
  const workspace = await getWorkspaceUnico();
  const registro = await prisma.brandKit.findUnique({ where: { workspaceId: workspace.id } });
  return registro ? paraDominio(registro) : REPLICA_BRAND_KIT;
}
