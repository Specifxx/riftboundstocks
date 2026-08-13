import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { accountsDisabledResponse, getCurrentUser } from "@/lib/auth";
import { cardById } from "@/lib/catalog";
import { latestQuote, primaryPrice } from "@/lib/prices";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

// GET: every card the signed-in user is watching (cardId only; the client
// resolves card details from the bundled catalogue it already has).
export async function GET() {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const alerts = await prisma.priceAlert.findMany({ where: { userId: user.id }, select: { cardId: true } });
  return NextResponse.json({ cardIds: alerts.map((a) => a.cardId) });
}

const bodySchema = z.object({ cardId: z.string().min(1) });

// POST {cardId}: start watching a card (idempotent). Records today's headline
// price as the baseline so the first alert email only fires on a REAL drop
// from here, not from whatever the price happened to be before this user
// started watching.
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
  if (existing) return NextResponse.json({ ok: true, watching: true });

  const price = primaryPrice(latestQuote(card));
  const alert = await prisma.priceAlert.create({
    data: { userId: user.id, cardId: card.id, lastPriceCents: price, unsubToken: randomBytes(24).toString("hex") },
  });
  return NextResponse.json({ ok: true, watching: true, id: alert.id });
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
