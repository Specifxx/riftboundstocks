import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { accountsDisabledResponse, getCurrentUser } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import { planLimits } from "@/lib/plans";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// Session-authed management of a signed-in user's public-API keys — distinct
// from /api/v1/*, which is key-authed. Used by the profile page.

// GET: every key the signed-in user holds. keyHash never leaves this route —
// only the label/suffix/timestamps a list view needs.
export async function GET() {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, keySuffix: true, createdAt: true, lastUsedAt: true, revokedAt: true },
  });
  return NextResponse.json({ keys });
}

const bodySchema = z.object({ label: z.string().min(1).max(60) });

// POST {label}: issue a new key. The plaintext is returned ONCE in this
// response and never stored — same principle as a password reset link.
export async function POST(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const limit = rateLimit(`keys:post:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { planTier: true } });
  const limits = planLimits(account?.planTier);
  if (!limits.publicApi) {
    return NextResponse.json({ error: `The public API needs a Pro or Store plan. See /premium.` }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const activeCount = await prisma.apiKey.count({ where: { userId: user.id, revokedAt: null } });
  if (activeCount >= 10) {
    return NextResponse.json({ error: "You already have 10 active keys. Revoke one first." }, { status: 403 });
  }

  const { plaintext, hash, suffix } = generateApiKey();
  const row = await prisma.apiKey.create({
    data: { userId: user.id, keyHash: hash, keySuffix: suffix, label: parsed.data.label },
  });
  return NextResponse.json({ ok: true, id: row.id, key: plaintext });
}

const deleteSchema = z.object({ id: z.string().min(1) });

// DELETE {id}: revoke a key. Soft-deleted (revokedAt set) rather than
// removed, so lastUsedAt/createdAt survive for the list view's history.
export async function DELETE(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.apiKey.updateMany({ where: { id: parsed.data.id, userId: user.id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
