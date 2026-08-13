// Daily price-drop alert batch job. Walks every PriceAlert, compares the
// card's CURRENT headline price (the same real TCGplayer-backed price every
// other page shows — see lib/prices' activeSource()/primaryPrice()) against
// the baseline recorded last run, and emails a digest per subscriber for
// anything that qualifies. Run from /api/cron/price-alerts.
//
// Two alert shapes share this one job:
//   - targetCents null (the CardActions "Watch" button's default): fire on
//     ANY drop from the baseline, same as the original behaviour.
//   - targetCents set (from the /alerts management UI): fire once when the
//     price CROSSES the target in `direction` — below means "drops to or
//     under", above means "rises to or over". Edge-detected against the
//     baseline so a card that sits past its target for a week notifies once,
//     not once per day; if the price later moves back across the target, the
//     next crossing notifies again.
//
// The baseline always advances (up or down) so a later move is measured
// against the most recent price, not a stale one, and a card with no current
// price is skipped for this run rather than treated as "dropped to zero".
import { prisma } from "./db";
import { cardById } from "./catalog";
import { latestQuote, primaryPrice } from "./prices";
import type { PriceDropItem } from "./email";
import { emailChannel } from "./alerts/delivery";
import { SITE_URL } from "./site";

export interface AlertRunSummary {
  alerts: number;
  drops: number;
  emails: number;
  updated: number;
}

export function crossed(prev: number | null, current: number, target: number, direction: string): boolean {
  const now = direction === "above" ? current >= target : current <= target;
  if (!now) return false;
  const was = prev == null ? false : direction === "above" ? prev >= target : prev <= target;
  return !was; // only the transition into the qualifying side, not every day spent there
}

export async function runPriceAlerts(): Promise<AlertRunSummary> {
  const alerts = await prisma.priceAlert.findMany({
    select: {
      id: true,
      userId: true,
      cardId: true,
      lastPriceCents: true,
      targetCents: true,
      direction: true,
      unsubToken: true,
      user: { select: { email: true } },
    },
  });

  const summary: AlertRunSummary = { alerts: alerts.length, drops: 0, emails: 0, updated: 0 };
  if (!alerts.length) return summary;

  const byEmail = new Map<string, { token: string; items: PriceDropItem[] }>();
  const updates: { id: string; price: number }[] = [];
  const notifiedIds: string[] = [];

  for (const a of alerts) {
    const card = cardById(a.cardId);
    if (!card) continue; // catalogue changed under us — nothing to compare

    const current = primaryPrice(latestQuote(card));
    if (current == null) continue; // not currently priced — nothing to compare

    const prev = a.lastPriceCents;
    const qualifies = a.targetCents != null ? crossed(prev, current, a.targetCents, a.direction) : prev != null && current < prev;

    if (qualifies) {
      summary.drops++;
      notifiedIds.push(a.id);
      const item: PriceDropItem = {
        name: card.name,
        setCode: card.setCode,
        collectorLabel: card.collectorLabel,
        url: `${SITE_URL}/card/${card.slug}`,
        oldCents: prev ?? current,
        newCents: current,
      };
      const bucket = byEmail.get(a.user.email) ?? { token: a.unsubToken, items: [] };
      bucket.items.push(item);
      byEmail.set(a.user.email, bucket);
    }

    if (prev !== current) updates.push({ id: a.id, price: current });
  }

  // Sequential sends — daily volume here is small, and it stays gentle on the
  // email provider's rate limits. Email is the only delivery channel wired
  // up today; see lib/alerts/delivery.ts for the SMS/Telegram/webhook stubs.
  for (const [email, { token, items }] of byEmail) {
    const unsubUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
    const sent = await emailChannel.send(email, items, unsubUrl);
    if (sent) summary.emails++;
  }

  summary.updated = updates.length;
  if (updates.length) {
    await prisma.$transaction(updates.map((u) => prisma.priceAlert.update({ where: { id: u.id }, data: { lastPriceCents: u.price } })));
  }
  if (notifiedIds.length) {
    await prisma.priceAlert.updateMany({ where: { id: { in: notifiedIds } }, data: { lastNotifiedAt: new Date() } });
  }

  return summary;
}
