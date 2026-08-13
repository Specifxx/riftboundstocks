// Pure portfolio math — kept separate from the /portfolio page and its API
// routes so it's independently testable (see scripts/verify-logic.ts) the
// same way lib/prices/index.ts's movers/domainHeat functions are.

import { cardById, type RiftCard } from "./catalog";
import { priceHistory, primaryPrice } from "./prices";
import { domainInfo, type DomainKey } from "./riftbound";

export interface HoldingLite {
  cardId: string;
  quantity: number;
}

export interface PortfolioValuePoint {
  day: string;
  cents: number;
  /** How many DISTINCT holdings contributed a price on this day — see the caveat below. */
  coverage: number;
}

/**
 * Portfolio value over time, built from each held card's own price history —
 * never fabricated. Uses TODAY'S quantities projected back across each card's
 * history (this site has no log of when a card was bought or how many were
 * held on a past date), which is an honest approximation, not a return
 * calculation — the UI must caption it as such. A day only sums holdings
 * that have a priced snapshot for that exact day; a card imported more
 * recently than another simply doesn't contribute to earlier days, so
 * `coverage` tells the caller how many of the N holdings had data for a
 * given point (useful for deciding whether to show a "partial" note).
 */
export function portfolioValueHistory(holdings: HoldingLite[]): PortfolioValuePoint[] {
  const byDay = new Map<string, { cents: number; coverage: number }>();

  for (const h of holdings) {
    const card = cardById(h.cardId);
    if (!card || h.quantity <= 0) continue;
    for (const snap of priceHistory(card)) {
      const v = primaryPrice(snap);
      if (v == null) continue;
      const bucket = byDay.get(snap.day) ?? { cents: 0, coverage: 0 };
      bucket.cents += v * h.quantity;
      bucket.coverage += 1;
      byDay.set(snap.day, bucket);
    }
  }

  return Array.from(byDay.entries())
    .map(([day, b]) => ({ day, cents: b.cents, coverage: b.coverage }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

export interface BreakdownSlice {
  key: string;
  label: string;
  color: string;
  valueCents: number;
  count: number;
}

/** Portfolio value grouped by Domain, for the breakdown panel. */
export function breakdownByDomain(holdings: HoldingLite[], valueOf: (card: RiftCard) => number | null): BreakdownSlice[] {
  const buckets = new Map<DomainKey, { value: number; count: number }>();
  for (const h of holdings) {
    const card = cardById(h.cardId);
    if (!card) continue;
    const v = valueOf(card);
    if (v == null) continue;
    const b = buckets.get(card.domain) ?? { value: 0, count: 0 };
    b.value += v * h.quantity;
    b.count += h.quantity;
    buckets.set(card.domain, b);
  }
  return Array.from(buckets.entries())
    .map(([domain, b]) => ({ key: domain, label: domainInfo(domain).label, color: domainInfo(domain).color, valueCents: b.value, count: b.count }))
    .sort((a, b) => b.valueCents - a.valueCents);
}

/** Portfolio value grouped by Set, for the breakdown panel. */
export function breakdownBySet(holdings: HoldingLite[], valueOf: (card: RiftCard) => number | null): BreakdownSlice[] {
  const buckets = new Map<string, { label: string; value: number; count: number }>();
  for (const h of holdings) {
    const card = cardById(h.cardId);
    if (!card) continue;
    const v = valueOf(card);
    if (v == null) continue;
    const b = buckets.get(card.setCode) ?? { label: card.setName, value: 0, count: 0 };
    b.value += v * h.quantity;
    b.count += h.quantity;
    buckets.set(card.setCode, b);
  }
  return Array.from(buckets.entries())
    .map(([setCode, b]) => ({ key: setCode, label: b.label, color: "", valueCents: b.value, count: b.count }))
    .sort((a, b) => b.valueCents - a.valueCents);
}
