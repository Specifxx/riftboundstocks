// Read layer for sealed products: the catalogue built by scripts/build-sealed.ts
// and the daily prices written by scripts/import-prices.ts.
//
// Sealed stores only `mid` and `market`. `low` is deliberately absent: the
// cheapest sealed listing is routinely nonsense — a $12 "Vendetta Booster
// Display" against a $160 market, a $2,039 Pre-Rift Event Kit against $275 —
// because sellers list accessories, empty boxes and single packs under the box
// product. Market is the only figure worth publishing for a box.

import sealedFile from "@/data/sealed.json";
import sealedPrices from "@/data/sealed-prices.json";
import sealedHistory from "@/data/sealed-history.json";
import type { SealedFile, SealedProduct, SealedType } from "./prices/sealed";
import { SEALED_GROUP, SEALED_TYPE_LABEL } from "./prices/sealed";
import type { HistoryFile, PriceFile, QuoteTuple } from "./prices/store";

const CATALOGUE = sealedFile as unknown as SealedFile;
const PRICES = sealedPrices as unknown as PriceFile;
const HISTORY = sealedHistory as unknown as HistoryFile;

export interface SealedRow extends SealedProduct {
  /** TCGplayer market price in USD cents. null = no price, never zero. */
  market: number | null;
  /** TCGplayer listed median in USD cents. */
  mid: number | null;
  typeLabel: string;
  group: "boxes" | "packs" | "starters";
}

function quote(productId: number): QuoteTuple | null {
  return PRICES.cards?.[String(productId)] ?? null;
}

export const SEALED: SealedRow[] = (CATALOGUE.products ?? []).map((p) => {
  const t = quote(p.productId);
  return {
    ...p,
    mid: t?.[1] ?? null,
    market: t?.[2] ?? null,
    typeLabel: SEALED_TYPE_LABEL[p.type],
    group: SEALED_GROUP[p.type],
  };
});

export const HAS_SEALED = SEALED.length > 0;
export const SEALED_PRICED = SEALED.filter((p) => p.market != null).length;
export const SEALED_UPDATED_AT: string | null = PRICES.fetchedAt || null;
export const SEALED_HISTORY_DAYS: string[] = HISTORY.days ?? [];

export function sealedInGroup(group: "boxes" | "packs" | "starters"): SealedRow[] {
  return SEALED.filter((p) => p.group === group).sort((a, b) => (b.market ?? -1) - (a.market ?? -1));
}

export function sealedForSet(setCode: string): SealedRow[] {
  return SEALED.filter((p) => p.setCode === setCode).sort((a, b) => (b.market ?? -1) - (a.market ?? -1));
}

export function sealedByType(type: SealedType): SealedRow[] {
  return SEALED.filter((p) => p.type === type).sort((a, b) => (b.market ?? -1) - (a.market ?? -1));
}

/** Daily market series for one product, oldest → newest. Gaps stay gaps. */
export function sealedHistoryFor(productId: number): { day: string; market: number }[] {
  const row = HISTORY.cards?.[String(productId)];
  if (!row) return [];
  const out: { day: string; market: number }[] = [];
  HISTORY.days.forEach((day, i) => {
    const m = row[i]?.[2];
    if (m != null) out.push({ day, market: m });
  });
  return out;
}

export type { SealedProduct, SealedType };
