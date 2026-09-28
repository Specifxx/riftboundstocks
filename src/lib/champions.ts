// Which League of Legends champion a printing depicts.
//
// The catalogue has no champion field, but the name almost always carries it:
//   "Ahri, Alluring"           unit        → before the comma
//   "Ashe - Focused"           promo       → before the " - "
//   "Nine-Tailed Fox"          Legend      → NOT in the name at all
//
// Legends are the awkward case. RiftScribe names them by title only, but
// TCGplayer's product URL spells the champion out ("…-origins-ahri-nine-tailed-
// fox"), so the champion is whatever known champion slug sits immediately before
// the title in that URL. The known list is built from the comma-named units, so
// nothing here is a hand-maintained roster that can drift from the data.
//
// Anything that doesn't resolve (spells, gear, runes, battlefields, generic
// units, the odd Legend TCGplayer hasn't listed) returns null rather than a
// guess — champion pages list only cards we can attribute with certainty.

import { CARDS, type RiftCard } from "./catalog";
import { cardDetail } from "./card-details";

export interface Champion {
  name: string;
  slug: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Riot's own naming isn't always consistent: the Proving Grounds starter
// prints "Yi, Meditative", and TCGplayer sells the promo reprint of the same
// card as "Master Yi - Meditative".
const ALIASES: Record<string, string> = { Yi: "Master Yi" };

function nameChampion(name: string): string | null {
  let n: string | null = null;
  const comma = name.indexOf(",");
  const dash = name.indexOf(" - ");
  if (comma > 0) n = name.slice(0, comma).trim();
  else if (dash > 0) n = name.slice(0, dash).trim();
  return n ? ALIASES[n] ?? n : null;
}

// Every champion with at least one comma-named UNIT — the reliable roster.
// (Battlefields use the same "Name, Title" shape but are places, not people.)
const ROSTER = new Map<string, string>(); // slug → display name
for (const c of CARDS) {
  if (!c.name.includes(",") || c.type !== "Unit") continue;
  const n = nameChampion(c.name);
  if (n) ROSTER.set(slugify(n), n);
}

function legendChampion(card: RiftCard): string | null {
  const url = cardDetail(card.id)?.url;
  if (!url) return null;
  const tail = url.split("/").pop() ?? "";
  const title = slugify(card.name);
  const i = tail.lastIndexOf(`-${title}`);
  if (i <= 0) return null;
  const before = tail.slice(0, i);
  // Longest match first, so "master-yi" wins over "yi".
  let best: string | null = null;
  for (const slug of ROSTER.keys()) {
    if ((before === slug || before.endsWith(`-${slug}`)) && (!best || slug.length > best.length)) best = slug;
  }
  return best ? ROSTER.get(best)! : null;
}

function resolve(card: RiftCard): string | null {
  const fromName = nameChampion(card.name);
  if (fromName && ROSTER.has(slugify(fromName))) return ROSTER.get(slugify(fromName))!;
  if (card.type === "Legend") return legendChampion(card);
  return null;
}

const BY_CARD = new Map<string, string>();
const BY_CHAMPION = new Map<string, RiftCard[]>();
for (const c of CARDS) {
  const name = resolve(c);
  if (!name) continue;
  BY_CARD.set(c.id, name);
  const slug = slugify(name);
  const list = BY_CHAMPION.get(slug);
  if (list) list.push(c);
  else BY_CHAMPION.set(slug, [c]);
}

export function championOf(card: RiftCard): Champion | null {
  const name = BY_CARD.get(card.id);
  return name ? { name, slug: slugify(name) } : null;
}

/** Every champion with at least one attributable printing, A–Z. */
export function allChampions(): (Champion & { count: number })[] {
  return [...BY_CHAMPION.entries()]
    .map(([slug, cards]) => ({ slug, name: ROSTER.get(slug) ?? slug, count: cards.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function championBySlug(slug: string): Champion | null {
  const name = ROSTER.get(slug);
  return name && BY_CHAMPION.has(slug) ? { name, slug } : null;
}

export function cardsForChampion(slug: string): RiftCard[] {
  return BY_CHAMPION.get(slug) ?? [];
}

/**
 * The card's rules name — the same card however it was sold.
 *
 * Promos are sold as "Draven - Vanquisher (Metal) (Prize Wall)" and starter
 * Legends as "Wuju Bladesman - Starter"; Legends are named by title alone, so
 * the champion is prefixed back on ("Master Yi, Wuju Bladesman"). Used by the
 * ban list and to group a card's printings.
 */
export function rulesName(card: RiftCard): string {
  let n = card.name
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+-\s+Starter$/i, "")
    .trim();
  n = n.replace(/\s+-\s+/, ", ");
  const comma = n.indexOf(", ");
  if (comma > 0 && ALIASES[n.slice(0, comma)]) n = ALIASES[n.slice(0, comma)] + n.slice(comma);
  if (card.type === "Legend" && !n.includes(",")) {
    const champ = championOf(card);
    if (champ) n = `${champ.name}, ${n}`;
  }
  return n;
}

const printingKey = (c: RiftCard) => rulesName(c).toLowerCase().replace(/[^a-z0-9]/g, "");
const BY_RULES_NAME = new Map<string, RiftCard[]>();
for (const c of CARDS) {
  const k = printingKey(c);
  const list = BY_RULES_NAME.get(k);
  if (list) list.push(c);
  else BY_RULES_NAME.set(k, [c]);
}

/**
 * Every OTHER printing of the same card — base, alt art, Signature, and the
 * promo reprints whose product names ("… (Metal) (Prize Wall)") a plain name
 * match misses.
 */
export function otherPrintingsOf(card: RiftCard): RiftCard[] {
  return (BY_RULES_NAME.get(printingKey(card)) ?? []).filter((c) => c.id !== card.id);
}

/** Every printing of the card with this rules name ("Ahri, Nine-Tailed Fox"). */
export function printingsNamed(rules: string): RiftCard[] {
  return BY_RULES_NAME.get(rules.toLowerCase().replace(/[^a-z0-9]/g, "")) ?? [];
}
