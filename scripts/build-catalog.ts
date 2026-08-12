/**
 * Refresh the bundled card catalogue from RiftScribe.
 *
 * Ported from TCGEmpire's scripts/fetch-cards.ts — the same source, the same
 * shape, so a catalogue file is interchangeable between the two projects.
 *
 * Usage: npm run seed:catalog
 *
 * RiftScribe (https://riftscribe.gg) is a free community card database serving
 * public data with no auth. Card IMAGES stay on their CDN and are hot-linked
 * rather than copied — re-hosting several hundred megabytes of Riot's artwork
 * would be both wasteful and a much bigger copyright ask than referencing it.
 * The image URLs, thumbnails and blur placeholders all come down in this feed,
 * which is why there is no separate image pipeline to run.
 *
 * Writes src/data/riftbound-cards.json. Nothing reads the network at runtime.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = "https://riftscribe.gg/api/cards";
const PAGE = 100;

interface RsCard {
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

async function main() {
  const all: RsCard[] = [];
  let offset = 0;

  for (;;) {
    const res = await fetch(`${BASE}?limit=${PAGE}&offset=${offset}`);
    if (!res.ok) throw new Error(`RiftScribe API ${res.status} at offset ${offset}`);
    const batch = (await res.json()) as RsCard[];
    all.push(...batch);
    process.stdout.write(`\rFetched ${all.length} cards…`);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }

  // Refuse to overwrite a good catalogue with a truncated response — a partial
  // fetch that silently lands would delete card pages on the next deploy.
  if (all.length < 500) {
    throw new Error(`Only ${all.length} cards returned; refusing to overwrite the catalogue.`);
  }

  const out = fileURLToPath(new URL("../src/data/riftbound-cards.json", import.meta.url));
  writeFileSync(out, JSON.stringify(all));

  const sets = new Map<string, number>();
  for (const c of all) sets.set(c.set_id, (sets.get(c.set_id) ?? 0) + 1);

  console.log(`\nWrote ${all.length} cards to src/data/riftbound-cards.json`);
  for (const [set, n] of [...sets].sort()) console.log(`  ${set}  ${n}`);
  console.log("\nIf a NEW set appeared, add it to SETS in src/lib/riftbound.ts —");
  console.log("cards in an unknown set render without a set name or release date.");
}

main().catch((e) => {
  console.error(`\n${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
