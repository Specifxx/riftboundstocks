import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { accountsDisabledResponse, getCurrentUser } from "@/lib/auth";
import { cardById } from "@/lib/catalog";
import { latestQuote, primaryPrice } from "@/lib/prices";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";
import { planLimits } from "@/lib/plans";

// GET: every alert the signed-in user has. `cardIds` is kept for
// CardActions.tsx's simple watching/not-watching check; `alerts` carries the
// full row (target, direction, last price) for the /alerts management page.
export async function GET() {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, cardId: true, targetCents: true, direction: true, lastPriceCents: true, lastNotifiedAt: true, createdAt: true },
  });
  return NextResponse.json({ cardIds: alerts.map((a) => a.cardId), alerts });
}

const bodySchema = z.object({
  cardId: z.string().min(1),
  targetCents: z.number().int().min(0).nullable().optional(),
  direction: z.enum(["below", "above"]).optional(),
});

// POST {cardId, targetCents?, direction?}: start watching a card (idempotent
// on cardId — an existing alert is left as-is, use PATCH to change its
// target). Records today's headline price as the baseline so the first
// notification only fires on a REAL move from here, not from whatever the
// price happened to be before this user started watching.
export async function POST(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const limit = rateLimit(`alerts:post:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const card = cardById(parsed.data.cardId);
  if (!card) return NextResponse.json({ error: "Unknown card." }, { status: 400 });

  const existing = await prisma.priceAlert.findUnique({ where: { userId_cardId: { userId: user.id, cardId: card.id } } });
  if (existing) return NextResponse.json({ ok: true, watching: true, id: existing.id });

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { planTier: true } });
  const limits = planLimits(account?.planTier);
  if (limits.maxAlerts != null) {
    const count = await prisma.priceAlert.count({ where: { userId: user.id } });
    if (count >= limits.maxAlerts) {
      return NextResponse.json(
        { error: `Your ${limits.label} plan allows up to ${limits.maxAlerts} alerts. Remove one, or upgrade on /premium.` },
        { status: 403 },
      );
    }
  }

  const price = primaryPrice(latestQuote(card));
  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      cardId: card.id,
      lastPriceCents: price,
      targetCents: parsed.data.targetCents ?? null,
      direction: parsed.data.direction ?? "below",
      unsubToken: randomBytes(24).toString("hex"),
    },
  });
  return NextResponse.json({ ok: true, watching: true, id: alert.id });
}

const patchSchema = z.object({
  cardId: z.string().min(1),
  targetCents: z.number().int().min(0).nullable(),
  direction: z.enum(["below", "above"]),
});

// PATCH {cardId, targetCents, direction}: change an existing alert's
// threshold. Separate from POST so re-saving a target can never accidentally
// re-create a deleted alert or double-count against the plan cap.
export async function PATCH(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await prisma.priceAlert.updateMany({
    where: { userId: user.id, cardId: parsed.data.cardId },
    data: { targetCents: parsed.data.targetCents, direction: parsed.data.direction },
  });
  if (result.count === 0) return NextResponse.json({ error: "No alert on that card yet." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE {cardId}: stop watching.
export async function DELETE(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.priceAlert.deleteMany({ where: { userId: user.id, cardId: parsed.data.cardId } });
  return NextResponse.json({ ok: true, watching: false });
}
