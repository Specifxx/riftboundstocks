/**
 * Assertion checks for the new pure-logic modules added in this revamp —
 * price-alert threshold crossing, domain heat aggregation, portfolio value
 * history, plan limits, and CSV import parsing. Same pattern as
 * verify-reports.ts: plain asserts over real functions, no test framework
 * (this repo has none — see README's "Stack" section), run with:
 *
 *   npm run verify:logic
 */
import { crossed } from "../src/lib/price-alerts";
import { domainHeat } from "../src/lib/prices/index";
import { portfolioValueHistory, breakdownByDomain, breakdownBySet } from "../src/lib/portfolio";
import { parsePortfolioCsv } from "../src/lib/portfolio-csv";
import { PLAN_TIERS, PLANS, planLimits } from "../src/lib/plans";
import { CARDS } from "../src/lib/catalog";
import { DOMAIN_KEYS } from "../src/lib/riftbound";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(52)} expected ${JSON.stringify(expected)}  ·  actual ${JSON.stringify(actual)}`);
}
function ok(label: string, cond: boolean) {
  if (!cond) failures++;
  console.log(`  ${cond ? "ok  " : "FAIL"}  ${label}`);
}

// ── price-alert threshold crossing ───────────────────────────────────────────
console.log("\nprice-alert crossing (below)");
check("no baseline, price already under target → fires once", crossed(null, 90, 100, "below"), true);
check("was above, drops to/under target → fires", crossed(120, 100, 100, "below"), true);
check("was already at/under target, stays there → does NOT re-fire", crossed(95, 90, 100, "below"), false);
check("still above target → does not fire", crossed(150, 130, 100, "below"), false);

console.log("\nprice-alert crossing (above)");
check("was below, rises to/over target → fires", crossed(80, 100, 100, "above"), true);
check("was already at/over target, stays there → does NOT re-fire", crossed(105, 110, 100, "above"), false);
check("still below target → does not fire", crossed(50, 70, 100, "above"), false);

// ── domain heat ──────────────────────────────────────────────────────────────
console.log("\ndomain heat");
const heat = domainHeat();
ok("excludes Colorless (not a Domain a card is IN)", !heat.some((e) => e.domain === "Colorless"));
ok("covers every real Domain exactly once", DOMAIN_KEYS.filter((d) => d !== "Colorless").every((d) => heat.filter((e) => e.domain === d).length === 1));
ok("every entry's cardCount is non-negative and totalValue is non-negative", heat.every((e) => e.cardCount >= 0 && e.totalValue >= 0));

// ── portfolio value history ──────────────────────────────────────────────────
console.log("\nportfolio value history");
const twoCards = CARDS.slice(0, 2).map((c) => ({ cardId: c.id, quantity: 2 }));
const history = portfolioValueHistory(twoCards);
ok("output is sorted by day ascending", history.every((p, i) => i === 0 || p.day >= history[i - 1].day));
ok("every point's cents is non-negative", history.every((p) => p.cents >= 0));
check("empty holdings → empty history", portfolioValueHistory([]), []);
check("zero-quantity holding contributes nothing", portfolioValueHistory([{ cardId: CARDS[0].id, quantity: 0 }]), []);

const domainSlices = breakdownByDomain(twoCards, () => 500);
const setSlices = breakdownBySet(twoCards, () => 500);
ok("domain breakdown sorted by value descending", domainSlices.every((s, i) => i === 0 || s.valueCents <= domainSlices[i - 1].valueCents));
ok("set breakdown sorted by value descending", setSlices.every((s, i) => i === 0 || s.valueCents <= setSlices[i - 1].valueCents));

// ── plan limits ──────────────────────────────────────────────────────────────
console.log("\nplan limits");
check("planLimits falls back to FREE for garbage input", planLimits("not-a-real-tier").tier, "FREE");
check("planLimits falls back to FREE for null", planLimits(null).tier, "FREE");
ok(
  "limits only loosen as tier rises (FREE ≤ PLUS ≤ PRO ≤ STORE, null = unlimited)",
  (() => {
    // null = unlimited. Loosening means: if the lower tier was already
    // unlimited, the higher tier must be too (can't loosen past infinity);
    // otherwise the higher tier must be unlimited or numerically >=.
    const loosens = (a: number | null, b: number | null) => (a == null ? b == null : b == null || b >= a);
    for (let i = 1; i < PLAN_TIERS.length; i++) {
      const prev = PLANS[PLAN_TIERS[i - 1]];
      const cur = PLANS[PLAN_TIERS[i]];
      if (!loosens(prev.maxAlerts, cur.maxAlerts) || !loosens(prev.maxWatchlist, cur.maxWatchlist)) return false;
      if (prev.csvImport && !cur.csvImport) return false;
      if (prev.publicApi && !cur.publicApi) return false;
    }
    return true;
  })(),
);

// ── portfolio CSV import ─────────────────────────────────────────────────────
console.log("\nportfolio CSV import");
const sampleCard = CARDS[0];
const csv = `slug,quantity,condition,foil,costBasis\n${sampleCard.slug},3,NM,yes,12.50\nunknown-card-xyz,1,NM,no,5.00\n`;
const parsed = parsePortfolioCsv(csv);
check("valid row parsed", parsed.rows.length, 1);
check("unknown card reported as an error, not silently dropped", parsed.errors.length, 1);
check("quantity parsed", parsed.rows[0]?.quantity, 3);
check("foil parsed from 'yes'", parsed.rows[0]?.isFoil, true);
check("costBasis dollars → cents", parsed.rows[0]?.costBasisCents, 1250);

check("missing slug/cardId column → header error, zero rows", parsePortfolioCsv("name,qty\nfoo,1\n").rows.length, 0);
check("empty input → no rows, no errors", parsePortfolioCsv(""), { rows: [], errors: [] });

console.log(`\n${failures === 0 ? "All logic checks passed." : `${failures} CHECK(S) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);
