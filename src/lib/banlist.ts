// Riftbound's competitive ban lists.
//
// The catalogue's `is_banned` flag (RiftScribe) is false for every card, so it
// can't be trusted — and the card page used to print "Legal formats: Standard"
// under cards Riot has banned. This is the list as Riot announced it, in three
// waves, per RiftCompare's ban-list guide (BANLIST_URL). A ban applies to the
// CARD, so every printing of it — alt art, Signature, promo — is banned too.
//
// When Riot announces a new wave: add the cards here with the date it takes
// effect. `npm run verify:logic` fails if a name stops matching
// any printing in the catalogue.

import type { RiftCard } from "./catalog";
import { rulesName } from "./champions";
import { riftcompareUrl } from "./affiliate";

export type BanFormat = "Standard" | "2v2";

export interface Ban {
  /** Card name as printed on a champion unit: "Name, Title". */
  name: string;
  formats: BanFormat[];
  /** yyyy-mm-dd the ban took effect. */
  since: string;
}

export const BANS: Ban[] = [
  // Wave 1 — announced and effective 31 March 2026.
  { name: "Scrapheap", formats: ["Standard", "2v2"], since: "2026-03-31" },
  { name: "Called Shot", formats: ["Standard", "2v2"], since: "2026-03-31" },
  { name: "Draven, Vanquisher", formats: ["Standard", "2v2"], since: "2026-03-31" },
  { name: "Reaver's Row", formats: ["Standard", "2v2"], since: "2026-03-31" },
  { name: "Fight or Flight", formats: ["Standard", "2v2"], since: "2026-03-31" },
  { name: "The Dreaming Tree", formats: ["Standard", "2v2"], since: "2026-03-31" },
  { name: "Obelisk of Power", formats: ["Standard", "2v2"], since: "2026-03-31" },
  // Wave 2 — effective 24 July 2026. The 2v2 list was created here, starting
  // as the whole Standard list plus one 2v2-only ban.
  { name: "Stealthy Pursuer", formats: ["Standard", "2v2"], since: "2026-07-24" },
  { name: "The Arena's Greatest", formats: ["Standard", "2v2"], since: "2026-07-24" },
  { name: "Aspirant's Climb", formats: ["Standard", "2v2"], since: "2026-07-24" },
  { name: "Master Yi, Wuju Bladesman", formats: ["2v2"], since: "2026-07-24" },
  // Wave 3 — effective 18 September 2026.
  { name: "Ekko, Recurrent", formats: ["Standard", "2v2"], since: "2026-09-18" },
  { name: "Stacked Deck", formats: ["Standard", "2v2"], since: "2026-09-18" },
];

export { rulesName };

export const BANLIST_URL = riftcompareUrl("/guides/riftbound-banlist-explained", "card-banlist");

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const BY_KEY = new Map(BANS.map((b) => [key(b.name), b]));

export function banFor(card: RiftCard): Ban | null {
  return BY_KEY.get(key(rulesName(card))) ?? BY_KEY.get(key(card.name)) ?? null;
}
