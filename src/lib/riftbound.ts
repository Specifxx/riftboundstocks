// Riftbound domain vocabulary — ported from TCGEmpire's lib/constants.ts so the
// two codebases label domains, rarities and sets identically and data stays
// portable between them.

export interface DomainInfo {
  key: DomainKey;
  label: string;
  color: string;
  tagline: string;
}

export type DomainKey = "Fury" | "Calm" | "Mind" | "Body" | "Chaos" | "Order" | "Colorless";

export const DOMAINS: Record<DomainKey, DomainInfo> = {
  Fury: { key: "Fury", label: "Fury", color: "#e5484d", tagline: "Aggression & burst" },
  Calm: { key: "Calm", label: "Calm", color: "#30a46c", tagline: "Growth & resilience" },
  Mind: { key: "Mind", label: "Mind", color: "#3b82f6", tagline: "Control & knowledge" },
  Body: { key: "Body", label: "Body", color: "#f5a524", tagline: "Endurance & power" },
  Chaos: { key: "Chaos", label: "Chaos", color: "#a855f7", tagline: "Disruption & risk" },
  Order: { key: "Order", label: "Order", color: "#cbd5e1", tagline: "Structure & protection" },
  Colorless: { key: "Colorless", label: "Colorless", color: "#8b8f9a", tagline: "Neutral staples" },
};

export const DOMAIN_KEYS = Object.keys(DOMAINS) as DomainKey[];

export const CARD_TYPES = ["Unit", "Spell", "Gear", "Rune", "Battlefield", "Legend"] as const;
export type CardType = (typeof CARD_TYPES)[number];

export type RarityKey = "Common" | "Uncommon" | "Rare" | "Epic" | "Showcase" | "Promo";

export interface RarityInfo {
  key: RarityKey;
  label: string;
  color: string;
  // Relative scarcity weight — drives the synthetic price anchor. Higher = rarer
  // = more expensive. Replaced wholesale by real market data once TCGplayer is wired.
  weight: number;
}

export const RARITIES: Record<RarityKey, RarityInfo> = {
  Common: { key: "Common", label: "Common", color: "#9aa0aa", weight: 1 },
  Uncommon: { key: "Uncommon", label: "Uncommon", color: "#30a46c", weight: 2.2 },
  Rare: { key: "Rare", label: "Rare", color: "#3b82f6", weight: 6 },
  Epic: { key: "Epic", label: "Epic", color: "#a855f7", weight: 16 },
  Showcase: { key: "Showcase", label: "Showcase", color: "#f5a524", weight: 34 },
  // TCGplayer's own rarity for event and organized-play printings. Not a booster
  // rarity — it says how the card was distributed, not how often it was pulled.
  Promo: { key: "Promo", label: "Promo", color: "#e0679a", weight: 40 },
};

export const RARITY_KEYS = Object.keys(RARITIES) as RarityKey[];

export interface SetInfo {
  code: string;
  name: string;
  slug: string;
  /** Drives the "Set Types" filter on /sets. */
  setType: "Core Set" | "Starter" | "Expansion" | "Promo";
  releasedOn: string;
  totalCards: number;
}

// The four sets present in the bundled catalogue. Codes, names and slugs match
// TCGEmpire's SETS table exactly so a card imported there resolves here unchanged.
export const SETS: SetInfo[] = [
  { code: "OGN", name: "Origins", slug: "origins", setType: "Core Set", releasedOn: "2025-10-31", totalCards: 298 },
  { code: "OGS", name: "Origins: Proving Grounds", slug: "proving-grounds", setType: "Starter", releasedOn: "2025-10-31", totalCards: 24 },
  { code: "SFD", name: "Spirit Forged", slug: "spiritforged", setType: "Expansion", releasedOn: "2026-02-27", totalCards: 221 },
  { code: "UNL", name: "Unleashed", slug: "unleashed", setType: "Expansion", releasedOn: "2026-05-15", totalCards: 219 },
  { code: "VEN", name: "Vendetta", slug: "vendetta", setType: "Expansion", releasedOn: "2026-07-31", totalCards: 166 },
  // Promo distributions. These are not booster sets — their cards are reprints
  // of base-set cards handed out at events, so their collector numbers carry the
  // BASE set's denominator (an OPP card numbered 013/298 is an Origins card).
  // `totalCards` is therefore the observed count, not a printed set size.
  // Names are TCGplayer's own setName strings, not inferences.
  { code: "OPP", name: "Organized Play Promos", slug: "organized-play", setType: "Promo", releasedOn: "2025-10-31", totalCards: 0 },
  { code: "PR", name: "Promotional Cards", slug: "promos", setType: "Promo", releasedOn: "2025-10-31", totalCards: 0 },
  { code: "SGN", name: "Secret Garden", slug: "secret-garden", setType: "Promo", releasedOn: "2026-05-15", totalCards: 3 },
  { code: "JDG", name: "Judge Promos", slug: "judge-promos", setType: "Promo", releasedOn: "2025-10-31", totalCards: 0 },
];

export const SET_BY_CODE: Record<string, SetInfo> = Object.fromEntries(SETS.map((s) => [s.code, s]));

export function setBySlug(slug: string): SetInfo | undefined {
  return SETS.find((s) => s.slug === slug.toLowerCase());
}

// Riftbound's constructed formats, adapted from the game's own format names.
export const FORMATS = ["Standard", "Legacy", "Draft", "Sealed"] as const;
export type Format = (typeof FORMATS)[number];

export function domainInfo(key: string): DomainInfo {
  return DOMAINS[key as DomainKey] ?? DOMAINS.Colorless;
}

export function rarityInfo(key: string): RarityInfo {
  return RARITIES[key as RarityKey] ?? RARITIES.Common;
}
