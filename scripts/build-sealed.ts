/**
 * Build the sealed-product catalogue from TCGplayer.
 *
 *   npm run seed:sealed
 *
 * Booster boxes, packs, Champion Decks, Pre-Rift kits, Nexus Night promo packs,
 * bundles and cases. Writes src/data/sealed.json; daily prices come from
 * scripts/import-prices.ts, which reads this file for the product ids.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fetchTcgplayerSealed, tcgProductUrl } from "../src/lib/prices/tcgplayer";
import { classifySealed, shortSealedName, SEALED_TYPE_LABEL, type SealedFile, type SealedProduct } from "../src/lib/prices/sealed";
import { SET_BY_CODE } from "../src/lib/riftbound";

const path = (name: string) => fileURLToPath(new URL(`../src/data/${name}`, import.meta.url));
const IMAGE = (id: number) => `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg`;

async function hasImage(productId: number): Promise<boolean> {
  try {
    return (await fetch(IMAGE(productId), { method: "HEAD" })).ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Fetching TCGplayer sealed products…");
  const products = await fetchTcgplayerSealed();

  // Server-side type filter should already exclude cards; assert it, because the
  // client-side "no collector number" rule that people reach for instead sweeps
  // up two real promo cards (one a $146 printing).
  const stray = products.filter((p) => p.customAttributes?.number);
  if (stray.length) {
    throw new Error(`Sealed feed returned ${stray.length} products with collector numbers: ${stray.map((p) => p.productName).join(", ")}`);
  }

  console.log(`  ${products.length} sealed products; probing images…`);
  const out: SealedProduct[] = [];
  let withImage = 0;

  for (const p of products) {
    const type = classifySealed(p.productName);
    const ok = await hasImage(p.productId);
    if (ok) withImage++;
    out.push({
      productId: p.productId,
      name: p.productName,
      shortName: shortSealedName(p.productName, p.setName),
      type,
      setCode: p.setCode,
      setName: SET_BY_CODE[p.setCode]?.name ?? p.setName,
      url: tcgProductUrl(p),
      image: ok ? IMAGE(p.productId) : null,
      releaseDate: p.customAttributes?.releaseDate?.slice(0, 10) ?? null,
      // TCGplayer flags presale in a free-text note; 40 of 54 carry one, and a
      // presale price is speculative rather than a traded figure.
      presale: /presale/i.test((p as unknown as { customAttributes?: { detailNote?: string } }).customAttributes?.detailNote ?? ""),
    });
  }

  const unclassified = out.filter((p) => p.type === "other");
  if (unclassified.length) {
    // The rule list is ordered and measured at 54/54. A fallthrough means
    // TCGplayer shipped a product shape the classifier has never seen, and
    // guessing its type would put it in the wrong section of /sealed.
    console.warn(`\n  ${unclassified.length} product(s) fell through to "other":`);
    for (const p of unclassified) console.warn(`    ${p.name}`);
  }

  const file: SealedFile = { updatedAt: new Date().toISOString(), products: out };
  writeFileSync(path("sealed.json"), JSON.stringify(file));

  const byType: Record<string, number> = {};
  for (const p of out) byType[p.type] = (byType[p.type] ?? 0) + 1;

  console.log(`\nWrote ${out.length} sealed products to src/data/sealed.json`);
  for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${SEALED_TYPE_LABEL[t as keyof typeof SEALED_TYPE_LABEL]}`);
  }
  console.log(`\nImages: ${withImage}/${out.length} (the rest are 403 at every size — genuinely absent)`);
}

main().catch((e) => {
  console.error(`\n${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
