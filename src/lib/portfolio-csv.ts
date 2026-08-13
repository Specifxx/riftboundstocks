// Portfolio CSV parsing — pulled out of the /api/portfolio/import route so it
// has no Next.js/Prisma dependency and can be exercised directly (see
// scripts/verify-logic.ts).

import { cardBySlug, cardById } from "./catalog";

export const CONDITIONS = new Set(["NM", "LP", "MP", "HP", "DMG"]);
export const MAX_CSV_ROWS = 2000;

export interface ParsedCsvRow {
  line: number;
  cardId: string;
  condition: string;
  isFoil: boolean;
  quantity: number;
  costBasisCents: number | null;
}

export interface CsvRowError {
  line: number;
  raw: string;
  reason: string;
}

export function splitCsvLine(line: string): string[] {
  // Minimal CSV: comma-separated, optional double-quote wrapping, "" for an
  // escaped quote. No embedded-newline support — a portfolio export is
  // simple tabular data, not free text, so this covers every real export
  // (this site's own or a spreadsheet's "Save as CSV") without pulling in a
  // parser library for four columns.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCsvBool(s: string): boolean {
  return ["1", "true", "yes", "y", "foil"].includes(s.trim().toLowerCase());
}

/**
 * Parses a portfolio CSV. Expected header (order doesn't matter, matching is
 * case-insensitive): slug OR cardId, quantity, condition, foil, costBasis
 * (dollars — "12.50", converted to cents). Only slug/cardId is required; the
 * rest default to 1 / NM / false / null (no cost basis = value-only tracking,
 * same default the manual add form uses).
 */
export function parsePortfolioCsv(text: string): { rows: ParsedCsvRow[]; errors: CsvRowError[] } {
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim() !== "");
  const rows: ParsedCsvRow[] = [];
  const errors: CsvRowError[] = [];
  if (lines.length === 0) return { rows, errors };

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const slugIdx = idx("slug");
  const cardIdIdx = idx("cardid") >= 0 ? idx("cardid") : idx("card_id");
  const qtyIdx = idx("quantity");
  const condIdx = idx("condition");
  const foilIdx = idx("foil");
  const costIdx = idx("costbasis") >= 0 ? idx("costbasis") : idx("cost_basis");

  if (slugIdx < 0 && cardIdIdx < 0) {
    errors.push({ line: 1, raw: lines[0], reason: 'Header must include a "slug" or "cardId" column.' });
    return { rows, errors };
  }

  for (let i = 1; i < lines.length && rows.length + errors.length < MAX_CSV_ROWS; i++) {
    const cols = splitCsvLine(lines[i]);
    const rawId = (slugIdx >= 0 ? cols[slugIdx] : cols[cardIdIdx])?.trim();
    if (!rawId) {
      errors.push({ line: i + 1, raw: lines[i], reason: "Missing slug/cardId." });
      continue;
    }
    const card = slugIdx >= 0 ? cardBySlug(rawId) ?? cardById(rawId) : cardById(rawId) ?? cardBySlug(rawId);
    if (!card) {
      errors.push({ line: i + 1, raw: lines[i], reason: `Unknown card "${rawId}".` });
      continue;
    }

    const quantity = qtyIdx >= 0 && cols[qtyIdx] ? Math.max(1, Math.min(9999, parseInt(cols[qtyIdx], 10) || 1)) : 1;
    const conditionRaw = condIdx >= 0 ? cols[condIdx]?.toUpperCase() : "";
    const condition = CONDITIONS.has(conditionRaw) ? conditionRaw : "NM";
    const isFoil = foilIdx >= 0 ? parseCsvBool(cols[foilIdx] ?? "") : false;
    const costRaw = costIdx >= 0 ? cols[costIdx]?.replace(/[$,]/g, "") : "";
    const cost = costRaw ? parseFloat(costRaw) : NaN;
    const costBasisCents = Number.isFinite(cost) && cost >= 0 ? Math.round(cost * 100) : null;

    rows.push({ line: i + 1, cardId: card.id, condition, isFoil, quantity, costBasisCents });
  }

  return { rows, errors };
}
