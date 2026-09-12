import type { BrandKit as BrandKitDb } from "@prisma/client";
import { prisma } from "./prisma";
import { REPLICA_BRAND_KIT, type BrandKit } from "@/lib/domain/brandKit";
import { linhaEditorialSchema, type LinhaEditorial } from "@/lib/domain/linhaEditorial";

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

/** [] quando o seed ainda não rodou ou o JSON salvo é inválido — sem foco declarado, o radar só pontua pelos outros critérios. */
export async function getLinhaEditorialAtiva(): Promise<LinhaEditorial> {
  const workspace = await prisma.workspace.findFirst({ where: { nome: NOME_WORKSPACE_UNICO } });
  const analisado = linhaEditorialSchema.safeParse(workspace?.linhaEditorial);
  return analisado.success ? analisado.data : [];
}
