// The card catalogue: real Riftbound cards (names, sets, domains, rarities and
// official RiftScribe card art), normalised once at module load and served from
// memory. 950 cards is small enough that an in-process index beats a database
// round-trip on every page, and it means the site builds and deploys with no
// infrastructure at all — see lib/repo.ts for the swap to Prisma.
//
// The raw file is the SAME artefact TCGEmpire ships at prisma/riftbound-cards.json,
// refreshed by scripts/build-catalog.ts (the ported image/catalogue ingestion).
import raw from "@/data/riftbound-cards.json";
import promos from "@/data/promo-cards.json";
import { SET_BY_CODE, type CardType, type DomainKey, type RarityKey } from "./riftbound";
import { normalizeSearch } from "./format";

interface RawCard {
  id: string;
  name: string;
  set_id: string;
  collector_number: number;
  rarity: string;
  faction: string;
  type: string;
  orientation: string;
  stats: { energy: number | null; might: number | null; power: number | null };
  image: string;
  image_thumb: { small: string; medium: string; large: string };
  image_blur_data_url: string;
  is_banned: boolean;
}

export interface RiftCard {
  /** RiftScribe id, e.g. "ogn-001-298". Stable across catalogue refreshes. */
  id: string;
  /** URL segment, e.g. "blazing-scorcher-ogn-1". Unique across the catalogue. */
  slug: string;
  name: string;
  nameNormalized: string;
  setCode: string;
  setName: string;
  collectorNumber: number;
  /** Display form, e.g. "001/298", "007a/298", "R01", "T03". */
  collectorLabel: string;
  /**
   * The collector number exactly as TCGplayer writes it ("001", "007a", "299*",
   * "R01", "T03", "SP1"). This — not `collectorNumber` — is the pricing join key.
   */
  numberToken: string;
  kind: "base" | "token" | "rune" | "special" | "promo";
  /**
   * TCGplayer product id, when the catalogue already knows it.
   *
   * Set for PROMO printings, which come from TCGplayer itself. It bypasses
   * collector-number matching entirely — and it has to, because promo numbers
   * collide badly: OPP draws from five base sets so numerators repeat, and the
   * same card ships at several event tiers ("Annie - Dark Child 017/024" exists
   * at $39, $1,850 and $2,210). A key that ignored the tier would publish a 56×
   * wrong price. Base-set cards leave this undefined and match by number.
   */
  tcgProductId?: number;
  /** Promos only: the set this card was originally printed in, from the denominator. */
  baseSetCode?: string;
  /** Promos only: event tier / finish, e.g. "Metal (Prize Wall)". */
  treatment?: string;
  /**
   * True when `imageUrl` is the BASE card's art rather than a picture of this
   * printing. TCGplayer has images for only 22% of OPP promos, so the rest
   * borrow the base-set illustration — which is the same picture for a straight
   * reprint but NOT for a Metal or alt-art promo. The UI must say so.
   */
  borrowedArt?: boolean;
  /**
   * Alt-art / Showcase suffix from the printing's id ("a" in "ogn-007a-298"),
   * null for the base art. The raw feed's `collector_number` drops this letter,
   * so a base card and its alt art arrive with the SAME number — parsing it back
   * out of the id is what keeps them distinct printings instead of collapsing
   * onto one page (120 cards in this catalogue are affected).
   */
  variant: string | null;
  rarity: RarityKey;
  domain: DomainKey;
  type: CardType;
  orientation: "portrait" | "landscape";
  energy: number | null;
  might: number | null;
  power: number | null;
  imageUrl: string;
  imageThumbUrl: string;
  blurDataUrl: string;
  isBanned: boolean;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/**
 * Everything the RiftScribe id encodes about a printing.
 *
 * THE ID IS AUTHORITATIVE, NOT `collector_number`. The feed's numeric field is
 * lossy: it strips the R/T/SP prefix from runes, tokens and special printings,
 * so Vendetta's "Fury Rune" (R01) and "Baccai Sandspinner" (001/166) both arrive
 * as collector_number 1. Keying on that number matched the rune to the unit's
 * TCGplayer product and would have published one card's price on another's page.
 *
 * Six id shapes exist in the catalogue:
 *   ogn-001-298      base printing        → "001"
 *   ogn-007a-298     alt art / Showcase   → "007a"
 *   ogn-299-star-298 Signature            → "299*"   (TCGplayer writes "299*")
 *   unl-t01          token                → "T01"
 *   ven-r01          rune                 → "R01"
 *   ven-sp1-006      special printing     → "SP1"
 */
interface ParsedId {
  /** Canonical number as TCGplayer writes it — the join key for pricing. */
  token: string;
  /** "a" (alt art) or "s" (Signature); null for a base print. */
  variant: string | null;
  kind: "base" | "token" | "rune" | "special";
  total: number | null;
}

function parseId(id: string, fallbackNumber: number): ParsedId {
  const body = id.replace(/^[a-z]+-/i, "");

  let m = body.match(/^(\d+)-star-(\d+)$/i);
  if (m) return { token: `${m[1]}*`, variant: "s", kind: "base", total: Number(m[2]) };

  m = body.match(/^(\d+)([a-z]+)-(\d+)$/i);
  if (m) return { token: `${m[1]}${m[2].toLowerCase()}`, variant: m[2].toLowerCase(), kind: "base", total: Number(m[3]) };

  m = body.match(/^(\d+)-(\d+)$/);
  if (m) return { token: m[1], variant: null, kind: "base", total: Number(m[2]) };

  m = body.match(/^t(\d+)$/i);
  if (m) return { token: `T${m[1]}`, variant: null, kind: "token", total: null };

  m = body.match(/^r(\d+)([a-z]*)$/i);
  if (m) {
    const v = m[2] ? m[2].toLowerCase() : null;
    return { token: `R${m[1]}${v ?? ""}`, variant: v, kind: "rune", total: null };
  }

  m = body.match(/^sp(\d+)-(\d+)$/i);
  if (m) return { token: `SP${m[1]}`, variant: null, kind: "special", total: Number(m[2]) };

  // Unknown shape — fall back to the numeric field rather than dropping the card,
  // but it will not price (no TCGplayer product keys to it) and that is visible.
  return { token: String(fallbackNumber), variant: null, kind: "base", total: null };
}

function normalise(c: RawCard): RiftCard {
  const set = SET_BY_CODE[c.set_id];
  const parsed = parseId(c.id, c.collector_number);
  const variant = parsed.variant;
  const total = parsed.total ?? set?.totalCards ?? 0;
  // Base printings keep the plain number in the slug (so /card/blazing-scorcher-ogn-1
  // stays stable); runes, tokens and specials use their prefixed token, because
  // their numbers collide with base cards in the same set.
  const slugNum =
    parsed.kind === "base" ? `${c.collector_number}${variant ?? ""}` : parsed.token.toLowerCase();
  return {
    id: c.id,
    // Set code + number token is what makes this unique. Card NAMES repeat across
    // sets (every set reprints the runes) and an alt-art print shares its base
    // card's number, so neither name nor number alone is enough.
    slug: `${slugify(c.name)}-${c.set_id.toLowerCase()}-${slugNum}`,
    name: c.name,
    nameNormalized: normalizeSearch(c.name),
    setCode: c.set_id,
    setName: set?.name ?? c.set_id,
    collectorNumber: c.collector_number,
    // Base printings show "007a/298"; runes and tokens have no set total and
    // show their bare token ("R01", "T03"), exactly as TCGplayer prints them.
    collectorLabel:
      parsed.kind === "base" && total
        ? `${parsed.token.padStart(parsed.token.includes("*") ? 4 : 3, "0")}/${total}`
        : parsed.total
          ? `${parsed.token}/${String(parsed.total).padStart(3, "0")}`
          : parsed.token,
    numberToken: parsed.token,
    kind: parsed.kind,
    variant,
    rarity: cap(c.rarity) as RarityKey,
    domain: cap(c.faction) as DomainKey,
    type: c.type as CardType,
    orientation: c.orientation === "landscape" ? "landscape" : "portrait",
    energy: c.stats?.energy ?? null,
    might: c.stats?.might ?? null,
    power: c.stats?.power ?? null,
    imageUrl: c.image,
    imageThumbUrl: c.image_thumb?.medium ?? c.image_thumb?.small ?? c.image,
    blurDataUrl: c.image_blur_data_url,
    isBanned: c.is_banned,
  };
}

// Promo printings (OPP/PR/SGN/JDG) come from TCGplayer rather than RiftScribe,
// which carries only booster-set cards. Built by scripts/build-promos.ts and
// already in RiftCard shape, so they simply join the catalogue.
export const CARDS: RiftCard[] = [...(raw as RawCard[]).map(normalise), ...(promos as unknown as RiftCard[])];

const BY_SLUG = new Map(CARDS.map((c) => [c.slug, c]));
const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

// Cards sharing a name are the same card printed more than once (runes and
// reprinted Legends). Drives the "Other printings" table on the card page.
const BY_NAME = new Map<string, RiftCard[]>();
for (const c of CARDS) {
  const key = c.nameNormalized;
  const list = BY_NAME.get(key);
  if (list) list.push(c);
  else BY_NAME.set(key, [c]);
}

const BY_SET = new Map<string, RiftCard[]>();
for (const c of CARDS) {
  const list = BY_SET.get(c.setCode);
  if (list) list.push(c);
  else BY_SET.set(c.setCode, [c]);
}
for (const list of BY_SET.values()) list.sort((a, b) => a.collectorNumber - b.collectorNumber);

export function cardBySlug(slug: string): RiftCard | undefined {
  return BY_SLUG.get(slug);
}

export function cardById(id: string): RiftCard | undefined {
  return BY_ID.get(id);
}

export function cardsInSet(setCode: string): RiftCard[] {
  return BY_SET.get(setCode) ?? [];
}

/** Every OTHER printing of the same card, for the card page's printings table. */
export function otherPrintings(card: RiftCard): RiftCard[] {
  return (BY_NAME.get(card.nameNormalized) ?? []).filter((c) => c.id !== card.id);
}

export function allPrintings(card: RiftCard): RiftCard[] {
  return BY_NAME.get(card.nameNormalized) ?? [card];
}

/**
 * Name search. Matches on the punctuation-stripped name so "kaisa" finds "Kai'Sa",
 * ranking prefix matches above substring matches so typing "jin" surfaces "Jinx"
 * before "Marauding Jinxblade".
 */
export function searchCards(query: string, limit = 24): RiftCard[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  const starts: RiftCard[] = [];
  const contains: RiftCard[] = [];
  for (const c of CARDS) {
    if (c.nameNormalized.startsWith(q)) starts.push(c);
    else if (c.nameNormalized.includes(q)) contains.push(c);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
