// Auth for the public read-only API (src/app/api/v1/*). Separate from the
// session-cookie auth in lib/auth.ts — that's for browser sessions on this
// site, this is for third-party scripts calling the API with a long-lived key.

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";
import { planLimits, type PlanLimits } from "./plans";

const KEY_PREFIX = "rl_live_";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Generates a new plaintext key. Shown to the user exactly once at creation. */
export function generateApiKey(): { plaintext: string; hash: string; suffix: string } {
  const plaintext = `${KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  return { plaintext, hash: hashKey(plaintext), suffix: plaintext.slice(-6) };
}

export interface ApiKeyContext {
  userId: string;
  keyId: string;
  limits: PlanLimits;
}

/**
 * Resolves the `x-api-key` header (or `Authorization: Bearer <key>`) to a
 * user + their plan limits. Updates `lastUsedAt` best-effort (never blocks
 * the response on it). Returns null for anything invalid, revoked, or
 * belonging to a plan without API access — the route decides what error to
 * send back, this just answers "is this key good".
 */
export async function resolveApiKey(req: Request): Promise<ApiKeyContext | null> {
  const header = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!header) return null;

  const hash = hashKey(header.trim());
  const row = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, userId: true, revokedAt: true, user: { select: { planTier: true } } },
  });
  if (!row || row.revokedAt) return null;

  const limits = planLimits(row.user.planTier);
  if (!limits.publicApi) return null;

  prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { userId: row.userId, keyId: row.id, limits };
}
