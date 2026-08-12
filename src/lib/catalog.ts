// The card catalogue: real Riftbound cards (names, sets, domains, rarities and
// official RiftScribe card art), normalised once at module load and served from
// memory. 950 cards is small enough that an in-process index beats a database
// round-trip on every page, and it means the site builds and deploys with no
// infrastructure at all — see lib/repo.ts for the swap to Prisma.
//
// The raw file is the SAME artefact TCGEmpire ships at prisma/riftbound-cards.json,
// refreshed by scripts/build-catalog.ts (the ported image/catalogue ingestion).
import raw from "@/data/riftbound-cards.json";
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
  /** Display form with the set total, e.g. "001/298" or "007a/298". */
  collectorLabel: string;
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
 * The printing's variant token, parsed out of the RiftScribe id.
 *
 * Two forms exist and BOTH share their base card's `collector_number`, so
 * without this every alt art and every Signature print would slug-collide with
 * the card it re-prints (156 cards in this catalogue):
 *   "ogn-007a-298"     → "a"  alt art / Showcase
 *   "ogn-299-star-298" → "s"  Signature print, written "299*" by TCGplayer
 * Normalised to a single letter so it matches the numKey() convention the
 * TCGplayer importer uses on the other side (see lib/prices/tcgplayer.ts).
 */
function variantFromId(id: string): string | null {
  const m = id.match(/^[a-z]+-\d+([a-z]*)(?:-(star))?-\d+$/i);
  if (!m) return null;
  if (m[2]) return "s";
  return m[1] ? m[1].toLowerCase() : null;
}

function normalise(c: RawCard): RiftCard {
  const set = SET_BY_CODE[c.set_id];
  const total = set?.totalCards ?? 0;
  const variant = variantFromId(c.id);
  const num = `${c.collector_number}${variant ?? ""}`;
  return {
    id: c.id,
    // Set code + collector number + variant is what makes this unique. Card NAMES
    // repeat across sets (every set reprints the runes) and the alt-art print
    // shares its base card's number, so neither name nor number alone is enough.
    slug: `${slugify(c.name)}-${c.set_id.toLowerCase()}-${num}`,
    name: c.name,
    nameNormalized: normalizeSearch(c.name),
    setCode: c.set_id,
    setName: set?.name ?? c.set_id,
    collectorNumber: c.collector_number,
    // Signature prints render with TCGplayer's "*" so the two catalogues read
    // the same; alt arts keep their letter.
    collectorLabel: total
      ? `${String(c.collector_number).padStart(3, "0")}${variant === "s" ? "*" : (variant ?? "")}/${total}`
      : num,
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

export const CARDS: RiftCard[] = (raw as RawCard[]).map(normalise);

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
