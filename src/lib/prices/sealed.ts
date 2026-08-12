// Sealed products: booster boxes, packs, Champion Decks, Pre-Rift kits, Nexus
// Night promo packs, bundles and cases.
//
// TCGplayer splits these from singles server-side via
// `productTypeName: ["Sealed Products"]`, which is exact — 54 products, matching
// a client-side "no collector number" rule ID-for-ID except that the rule also
// swallows two real promo CARDS (one a $146 printing). Ask the API; don't guess.

export const SEALED_TYPES = [
  "booster_display",
  "display_case",
  "booster_pack",
  "sleeved_pack",
  "sleeved_pack_art_set",
  "champion_deck",
  "champion_deck_display",
  "showdown_decks",
  "showdown_decks_display",
  "pre_rift_kit",
  "event_kit",
  "promo_pack",
  "bulk_runes",
  "bulk_runes_case",
  "box_set",
  "box_set_case",
  "bundle",
  "other",
] as const;

export type SealedType = (typeof SEALED_TYPES)[number];

export const SEALED_TYPE_LABEL: Record<SealedType, string> = {
  booster_display: "Booster Box",
  display_case: "Display Case",
  booster_pack: "Booster Pack",
  sleeved_pack: "Sleeved Pack",
  sleeved_pack_art_set: "Sleeved Pack Art Set",
  champion_deck: "Champion Deck",
  champion_deck_display: "Champion Deck Display",
  showdown_decks: "Showdown Decks",
  showdown_decks_display: "Showdown Decks Display",
  pre_rift_kit: "Pre-Rift Kit",
  event_kit: "Pre-Rift Event Kit",
  promo_pack: "Promo Pack",
  bulk_runes: "Bulk Runes",
  bulk_runes_case: "Bulk Runes Case",
  box_set: "Box Set",
  box_set_case: "Box Set Case",
  bundle: "Bundle",
  other: "Other",
};

/** Which page section a type belongs in. */
export const SEALED_GROUP: Record<SealedType, "boxes" | "packs" | "starters"> = {
  booster_display: "boxes",
  display_case: "boxes",
  bulk_runes_case: "boxes",
  box_set_case: "boxes",
  event_kit: "boxes",
  champion_deck_display: "boxes",
  showdown_decks_display: "boxes",
  booster_pack: "packs",
  sleeved_pack: "packs",
  sleeved_pack_art_set: "packs",
  promo_pack: "packs",
  bulk_runes: "packs",
  champion_deck: "starters",
  showdown_decks: "starters",
  pre_rift_kit: "starters",
  box_set: "starters",
  bundle: "starters",
  other: "starters",
};

/**
 * ORDER IS LOAD-BEARING. Do not alphabetise or "tidy" this list.
 *
 * 22 of the 54 products match more than one rule, so their type is decided
 * purely by position. The sharpest case is
 * "Origins - Sleeved Booster Pack Art Bundle [Set of 3]", which contains
 * "Bundle", "Sleeved Booster" AND "Booster Pack" — letting `bundle` or
 * `booster_pack` run first types a $58 collector item as a $6 pack.
 *
 * The Showdown Decks rules must also precede every `\bdisplay\b` rule: a
 * "Showdown Decks: Zed vs Shen Display" is a display OF DECKS, not a booster
 * display. TCGEmpire shipped that exact bug and documented it, which is how it
 * got caught here.
 *
 * scripts/build-sealed.ts asserts 0 products fall through to `other`.
 */
const RULES: [RegExp, SealedType][] = [
  [/showdown\s+decks?.*\bdisplay\b/i, "showdown_decks_display"],
  [/showdown\s+decks?/i, "showdown_decks"],
  [/champion\s+deck.*\bdisplay\b/i, "champion_deck_display"],
  [/champion\s+deck/i, "champion_deck"],
  [/sleeved\s+booster.*(?:art\s+bundle|\[set\s+of)/i, "sleeved_pack_art_set"],
  [/sleeved\s+booster/i, "sleeved_pack"],
  [/booster\s+display\s+case|booster\s+(?:box|display)\s+case/i, "display_case"],
  [/booster\s+display|booster\s+box/i, "booster_display"],
  [/pre-?rift\s+event\s+kit/i, "event_kit"],
  [/pre-?rift\s+kit/i, "pre_rift_kit"],
  [/nexus\s+night(?:\s+\d+)?\s+(?:promo\s+)?pack|promo\s+pack/i, "promo_pack"],
  [/bulk\s+runes\s+case/i, "bulk_runes_case"],
  [/bulk\s+runes/i, "bulk_runes"],
  [/box\s+set\s+case|proving\s+grounds.*\bcase\b/i, "box_set_case"],
  [/proving\s+grounds|box\s+set|secret\s+garden\s+box/i, "box_set"],
  [/vault\s+bundle|worlds\s+bundle|\bbundle\b/i, "bundle"],
  [/booster\s+pack/i, "booster_pack"],
];

export function classifySealed(productName: string): SealedType {
  for (const [re, type] of RULES) if (re.test(productName)) return type;
  return "other";
}

export interface SealedProduct {
  productId: number;
  name: string;
  /** Display name with the set prefix stripped: "Booster Display", not "Origins - Booster Display". */
  shortName: string;
  type: SealedType;
  setCode: string;
  setName: string;
  url: string;
  /** null when TCGplayer has no image for it — 5 of 54 don't. Never a guessed URL. */
  image: string | null;
  releaseDate: string | null;
  /** TCGplayer still lists it as a presale, so its price is speculative. */
  presale: boolean;
}

export interface SealedFile {
  updatedAt: string;
  products: SealedProduct[];
}

/**
 * Strip the redundant set prefix TCGplayer puts on most sealed names.
 * "Origins - Booster Display" → "Booster Display". Left alone when there is no
 * prefix ("Riftbound: Bulk Runes").
 */
export function shortSealedName(name: string, setName: string): string {
  const prefix = `${setName} - `;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}
