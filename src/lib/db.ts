import { PrismaClient } from "@prisma/client";

// Prisma client singleton, used only by the (optional) accounts system and the
// price-snapshot readers — see the header comment in prisma/schema.prisma.
// Nothing imports this module unless ACCOUNTS_ENABLED (DATABASE_URL set) has
// already been checked, so a zero-config clone never constructs a client
// pointed at a missing database.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Reuse a single client across hot reloads in development to avoid exhausting
// database connections.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
