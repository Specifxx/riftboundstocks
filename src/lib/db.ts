import { PrismaClient } from "@prisma/client";

// Prisma client singleton, used only by the (optional) accounts system and the
// price-snapshot readers — see the header comment in prisma/schema.prisma.
// Nothing imports this module unless ACCOUNTS_ENABLED (DATABASE_URL set) has
// already been checked, so a zero-config clone never constructs a client
// pointed at a missing database.

// Ensure a generous connect_timeout (the standard libpq/Postgres connection
// param, in seconds) is set. WHY: Neon's pooled compute suspends when idle and
// takes a moment to resume on the next connection; if that resume takes longer
// than the driver's default timeout, the very first real query against a
// freshly created (or long-unused) database sees "P1001: Can't reach database
// server" even though the database is actually fine — it just hadn't finished
// waking up yet. RiftCompare's lib/db.ts hit exactly this in production and
// carries the same fix; port it here rather than rediscover it a second time.
// Additive only — a URL that already sets its own connect_timeout is untouched.
function withConnectTimeout(url: string | undefined, seconds: number): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", String(seconds));
    return u.toString();
  } catch {
    return url; // never let a URL-parsing edge case break startup over a timeout tweak
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: withConnectTimeout(process.env.DATABASE_URL, 15) });

// Reuse a single client across hot reloads in development to avoid exhausting
// database connections.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
