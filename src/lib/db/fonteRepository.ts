import type { Fonte } from "@prisma/client";
import { prisma } from "./prisma";

export async function listarFontesAtivas(): Promise<Fonte[]> {
  return prisma.fonte.findMany({ where: { ativo: true } });
}
