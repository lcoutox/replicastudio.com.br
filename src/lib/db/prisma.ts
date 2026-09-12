import { PrismaClient } from "@prisma/client";

// Padrão recomendado pelo próprio Prisma pra Next.js em dev: evita recriar o
// client a cada hot-reload, o que esgotaria as conexões do Postgres.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}
