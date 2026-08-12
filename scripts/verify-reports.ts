/**
 * Re-derive every figure quoted in the data reports and fail if one has drifted.
 *
 *   npm run verify:reports
 *
 * The reports in src/lib/content/reports.ts state hard numbers — medians,
 * counts, individual prices — computed from the price snapshot. Those numbers
 * live in prose, so nothing stops an edit (or a re-import) from leaving them
 * silently wrong, which would turn the one part of the site that is real
 * analysis into the least trustworthy part of it.
 *
 * This recomputes each claim from the data and diffs it. It also checks that
 * every card slug the reports cite still resolves.
 *
 * When a figure legitimately changes because prices moved, update BOTH the prose
 * and the expectation here, and move the report's `asOf` date.
 */
import { CARDS, cardBySlug, cardsInSet } from "../src/lib/catalog";
import { latestQuote, primaryPrice } from "../src/lib/prices";
import { cardDetail } from "../src/lib/card-details";
import { SEALED } from "../src/lib/sealed-data";
import { REPORTS } from "../src/lib/content/reports";
import { SETS } from "../src/lib/riftbound";

const BOOSTER = new Set(["OGN", "OGS", "SFD", "UNL", "VEN"]);
const money = (c: number | null) => (c == null ? "—" : `$${(c / 100).toFixed(2)}`);
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const priceOf = (c: (typeof CARDS)[number]) => primaryPrice(latestQuote(c));
const pricedIn = (pred: (c: (typeof CARDS)[number]) => boolean) =>
  CARDS.filter(pred).map(priceOf).filter((v): v is number => v != null);

let failures = 0;
function check(label: string, actual: string | number, expected: string | number) {
  const ok = String(actual) === String(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(52)} expected ${expected}  ·  actual ${actual}`);
}

// ── coverage ─────────────────────────────────────────────────────────────────
const priced = CARDS.filter((c) => priceOf(c) != null);
const foilOnly = priced.filter((c) => latestQuote(c).market == null && latestQuote(c).foilMarket != null);
const normalOnly = priced.filter((c) => latestQuote(c).market != null && latestQuote(c).foilMarket == null);
const both = priced.filter((c) => latestQuote(c).market != null && latestQuote(c).foilMarket != null);

console.log("\nfoil-is-the-default-printing");
check("priced printings", priced.length, 1376);
check("foil-only", foilOnly.length, 788);
check("normal-only", normalOnly.length, 78);
check("both printings", both.length, 510);
check(
  "median foil multiplier (both)",
  (median(both.map((c) => (latestQuote(c).foilMarket! / latestQuote(c).market!) * 1000)) / 1000).toFixed(2),
  "3.05",
);

// ── Metal promos ─────────────────────────────────────────────────────────────
const opp = CARDS.filter((c) => c.setCode === "OPP");
const oppPriced = opp.filter((c) => priceOf(c) != null);
const metal = oppPriced.filter((c) => /metal/i.test(c.name));
const nonMetal = oppPriced.filter((c) => !/metal/i.test(c.name));
const prizeWall = metal.filter((c) => /prize\s*wall/i.test(c.name));
const bestOf = metal.filter((c) => /best\s*of/i.test(c.name));

console.log("\nmetal-promos-hold-the-top-of-the-market");
check("OPP priced", oppPriced.length, 184);
check("Metal printings", metal.length, 46);
check("non-Metal printings", nonMetal.length, 138);
check("Metal median", money(median(metal.map((c) => priceOf(c)!))), "$1375.00");
check("non-Metal median", money(median(nonMetal.map((c) => priceOf(c)!))), "$3.71");
check("Prize Wall count", prizeWall.length, 30);
check("Prize Wall median", money(median(prizeWall.map((c) => priceOf(c)!))), "$1499.98");
check("Best Of count", bestOf.length, 16);
check("Best Of median", money(median(bestOf.map((c) => priceOf(c)!))), "$1362.50");
check("OPP total", money(pricedIn((c) => c.setCode === "OPP").reduce((a, b) => a + b, 0)), "$83294.45");
check("OPP median", money(median(pricedIn((c) => c.setCode === "OPP"))), "$11.69");

// ── alt art ──────────────────────────────────────────────────────────────────
const ratios: number[] = [];
for (const c of CARDS.filter((x) => x.variant === "a")) {
  const base = CARDS.find(
    (x) => x.setCode === c.setCode && x.nameNormalized === c.nameNormalized && x.variant === null && x.collectorNumber === c.collectorNumber,
  );
  if (!base) continue;
  const a = priceOf(c);
  const b = priceOf(base);
  if (a == null || b == null || b === 0) continue;
  ratios.push((a / b) * 1000);
}
console.log("\nthe-alt-art-premium-across-102-pairs");
check("comparable pairs", ratios.length, 102);
check("median ratio", (median(ratios) / 1000).toFixed(2), "5.65");

// ── signatures ───────────────────────────────────────────────────────────────
const sigs = pricedIn((c) => c.variant === "s");
console.log("\nthirty-six-signature-prints");
check("signature printings", sigs.length, 36);
check("signature total", money(sigs.reduce((a, b) => a + b, 0)), "$32445.22");
check("signature median", money(median(sigs)), "$642.60");
check("all signatures foil-only", CARDS.filter((c) => c.variant === "s" && latestQuote(c).market != null).length, 0);

// ── rarity ───────────────────────────────────────────────────────────────────
console.log("\nrarity-stops-predicting-price-at-the-top");
for (const [rarity, n, med] of [
  ["Common", 279, "$0.08"],
  ["Uncommon", 257, "$0.13"],
  ["Rare", 326, "$0.30"],
  ["Epic", 192, "$3.13"],
  ["Showcase", 120, "$59.38"],
] as const) {
  const vs = pricedIn((c) => BOOSTER.has(c.setCode) && c.rarity === rarity);
  check(`${rarity} count`, vs.length, n);
  check(`${rarity} median`, money(median(vs)), med);
}
check("max Common", money(Math.max(...pricedIn((c) => BOOSTER.has(c.setCode) && c.rarity === "Common"))), "$191.96");

// ── showcase distribution ────────────────────────────────────────────────────
console.log("\nunleashed-and-vendetta-dropped-showcase");
for (const [set, n] of [["OGN", 54], ["SFD", 66], ["UNL", 0], ["VEN", 0]] as const) {
  check(`${set} Showcase printings`, cardsInSet(set).filter((c) => c.rarity === "Showcase").length, n);
}
check("OGN Showcase median", money(median(pricedIn((c) => c.setCode === "OGN" && c.rarity === "Showcase"))), "$17.93");
check("SFD Showcase median", money(median(pricedIn((c) => c.setCode === "SFD" && c.rarity === "Showcase"))), "$61.10");
check("VEN top card is Rare", CARDS.filter((c) => c.setCode === "VEN").sort((a, b) => (priceOf(b) ?? 0) - (priceOf(a) ?? 0))[0].rarity, "Rare");

// ── sets / sealed ────────────────────────────────────────────────────────────
console.log("\nwhat-a-booster-box-costs-against-its-set");
for (const [set, total, med] of [
  ["OGN", "$18146.59", "$0.29"],
  ["SFD", "$14130.17", "$0.23"],
  ["UNL", "$11117.39", "$0.17"],
  ["VEN", "$4213.73", "$0.17"],
] as const) {
  const vs = pricedIn((c) => c.setCode === set);
  check(`${set} singles total`, money(vs.reduce((a, b) => a + b, 0)), total);
  check(`${set} median single`, money(median(vs)), med);
}
for (const [set, box, pack] of [
  ["OGN", "$275.22", "$14.43"],
  ["SFD", "$211.71", "$7.90"],
  ["VEN", "$160.00", "$6.73"],
  ["UNL", "$155.03", "$6.29"],
] as const) {
  check(`${set} booster display`, money(SEALED.find((p) => p.setCode === set && p.type === "booster_display")?.market ?? null), box);
  check(`${set} booster pack`, money(SEALED.find((p) => p.setCode === set && p.type === "booster_pack")?.market ?? null), pack);
}
check("all four displays presale", SEALED.filter((p) => p.type === "booster_display" && p.presale).length, 4);

// ── liquidity ────────────────────────────────────────────────────────────────
const thin = CARDS.filter((c) => {
  const v = priceOf(c);
  const d = cardDetail(c.id);
  return v != null && v >= 5000 && d != null && d.listings <= 2;
});
console.log("\nforty-three-thin-markets");
check("printings >= $50 with <= 2 listings", thin.length, 43);

// ── asking vs sales ──────────────────────────────────────────────────────────
const gaps = CARDS.map((c) => {
  const q = latestQuote(c);
  if (q.market == null || q.mid == null || q.market < 500) return null;
  return { c, r: (q.mid / q.market) * 1000 };
}).filter(Boolean) as { c: (typeof CARDS)[number]; r: number }[];
console.log("\nasking-prices-run-ahead-of-sales");
check("printings above $5 with both figures", gaps.length, 28);
check("median mid/market", (median(gaps.map((g) => g.r)) / 1000).toFixed(2), "1.42");

// ── every cited slug resolves ────────────────────────────────────────────────
console.log("\nslug integrity");
const bad: string[] = [];
for (const r of REPORTS) {
  if (!cardBySlug(r.heroCard)) bad.push(`${r.slug} hero → ${r.heroCard}`);
  for (const b of r.body) {
    if (b.kind === "card" && !cardBySlug(b.slug)) bad.push(`${r.slug} → ${b.slug}`);
    if (b.kind === "cardTable") for (const s of b.slugs) if (!cardBySlug(s)) bad.push(`${r.slug} table → ${s}`);
  }
}
check("broken card slugs", bad.length, 0);
if (bad.length) for (const b of bad) console.log(`        ${b}`);

// Every report must carry the machinery that marks it as measured rather than invented.
const unmarked = REPORTS.filter((r) => !r.dataReport || !r.asOf || r.author !== "data-desk");
check("reports marked + dated + desk-attributed", unmarked.length, 0);

console.log(`\n${REPORTS.length} reports checked. ${failures === 0 ? "All figures match the data." : `${failures} FIGURE(S) DO NOT MATCH.`}`);
if (SETS.length === 0) throw new Error("unreachable");
process.exit(failures === 0 ? 0 : 1);
