// Real per-printing detail from TCGplayer: the product link, and the card's
// actual rules and flavour text.
//
// This is why the card page no longer says "ability text isn't part of this
// dataset". RiftScribe's catalogue carries art and attributes but no rules text,
// so the site had nothing to show and (correctly) refused to invent any.
// TCGplayer publishes it per product, and the importer captures it.
//
// Still absent, and still not invented: the ARTIST credit. Neither source
// publishes it, so the card page links out rather than guessing.

import detailsFile from "@/data/card-details.json";
import type { CardDetail, DetailsFile } from "./prices/store";

const DETAILS = detailsFile as unknown as DetailsFile;

export function cardDetail(cardId: string): CardDetail | null {
  return DETAILS.cards?.[cardId] ?? null;
}

export const DETAILS_UPDATED_AT: string | null = DETAILS.updatedAt || null;

export type { CardDetail };
