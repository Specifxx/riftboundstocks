import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { accountsDisabledResponse, getCurrentUser } from "@/lib/auth";
import { cardById } from "@/lib/catalog";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

const bodySchema = z.object({
  cardId: z.string().min(1),
  condition: z.enum(CONDITIONS).default("NM"),
  isFoil: z.boolean().default(false),
  quantity: z.number().int().min(1).max(9999).default(1),
  costBasisCents: z.number().int().min(0).nullable().default(null),
  note: z.string().max(280).nullable().default(null),
});

// POST: add or update a holding. Same (card, condition, foil) combination
// updates in place — quantity/cost basis are meant to be corrected, not
// accumulated as new rows.
export async function POST(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const limit = rateLimit(`portfolio:post:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { cardId, condition, isFoil, quantity, costBasisCents, note } = parsed.data;
  if (!cardById(cardId)) return NextResponse.json({ error: "Unknown card." }, { status: 400 });

  const row = await prisma.collectionCard.upsert({
    where: { userId_cardId_condition_isFoil: { userId: user.id, cardId, condition, isFoil } },
    update: { quantity, costBasisCents, note },
    create: { userId: user.id, cardId, condition, isFoil, quantity, costBasisCents, note },
  });
  return NextResponse.json({ ok: true, id: row.id });
}

const deleteSchema = z.object({ id: z.string().min(1) });

// DELETE {id}: remove one holding row (must belong to the signed-in user).
export async function DELETE(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.collectionCard.deleteMany({ where: { id: parsed.data.id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
