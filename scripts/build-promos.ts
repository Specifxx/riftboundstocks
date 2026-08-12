/**
 * Build the promo catalogue from TCGplayer.
 *
 *   npm run seed:promos
 *
 * RiftScribe only carries booster-set cards, so the four promo distributions —
 * OPP (Organized Play), PR (Promotional), SGN (Secret Garden) and JDG (Judge) —
 * have no entry there at all. TCGplayer does carry them, with names, numbers,
 * rarities, rules text and domains, so it is the catalogue source for these.
 *
 * Writes src/data/promo-cards.json in RiftCard shape, which lib/catalog.ts
 * concatenates onto the RiftScribe cards.
 *
 * Each record stores its TCGplayer productId, so the price importer joins on
 * that and never has to key a promo by collector number. That matters: OPP
 * numbers are only unique within a BASE set (five of them share numerators) and
 * the same card ships at several event tiers — "Annie - Dark Child 017/024"
 * exists at $39.44, $1,850.00 and $2,210.34. A number-only key would publish a
 * 56× wrong price.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fetchTcgplayerCards, htmlToText, numKey, setFromTotal, type TcgProduct } from "../src/lib/prices/tcgplayer";
import { SET_BY_CODE } from "../src/lib/riftbound";

const PROMO_SETS = new Set(["OPP", "PR", "SGN", "JDG"]);
const path = (name: string) => fileURLToPath(new URL(`../src/data/${name}`, import.meta.url));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The event tier or finish, taken from the product name's parentheticals. */
function treatmentOf(name: string): string | null {
  const parts = [...name.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
  const keep = parts.filter((p) => !/^\d+$/.test(p));
  return keep.length ? keep.join(" ") : null;
}

/** TCGplayer's cardType strings are richer than ours; fold them onto our six. */
function mapType(raw: string[] | null | undefined): string {
  const first = (raw ?? [])[0] ?? "Unit";
  if (/legend/i.test(first)) return "Legend";
  if (/battlefield/i.test(first)) return "Battlefield";
  if (/rune/i.test(first)) return "Rune";
  if (/gear/i.test(first)) return "Gear";
  if (/spell/i.test(first)) return "Spell";
  return "Unit";
}

/**
 * A dual-domain card ("Mind;Order") is stored under its FIRST domain, because
 * the site's domain model — filters, pills, the /domains hub — is single-valued.
 * Lossy and worth revisiting if dual-domain cards become common.
 */
function mapDomain(raw: string | null | undefined): string {
  const first = (raw ?? "").split(";")[0].trim();
  if (!first || first === "None" || first === "null") return "Colorless";
  return first;
}

function mapRarity(raw: string | null | undefined): string {
  const known = ["Common", "Uncommon", "Rare", "Epic", "Showcase", "Promo"];
  return known.includes(raw ?? "") ? (raw as string) : "Promo";
}

const IMAGE = (id: number) => `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg`;

/**
 * Does TCGplayer actually have art for this product?
 *
 * Probed rather than assumed: only ~22% of OPP promos have an image, and the
 * rest return 403 at EVERY size (re-checked against five URL forms). Emitting an
 * unverified URL would ship a wall of broken tiles.
 */
async function hasImage(productId: number): Promise<boolean> {
  try {
    const res = await fetch(IMAGE(productId), { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

interface RsCard {
  id: string;
  name: string;
  set_id: string;
  collector_number: number;
  image: string;
  image_thumb: { small: string; medium: string; large: string };
  image_blur_data_url: string;
}

async function main() {
  console.log("Fetching TCGplayer card catalogue…");
  const products = await fetchTcgplayerCards();
  const promos = products.filter((p) => PROMO_SETS.has(p.setCode) && p.customAttributes?.number);
  console.log(`  ${promos.length} promo printings across ${PROMO_SETS.size} sets`);

  // Base-set art, indexed by "SET:number", for the borrowed-art fallback.
  const rs = JSON.parse(readFileSync(path("riftbound-cards.json"), "utf8")) as RsCard[];
  const baseArt = new Map<string, RsCard>();
  for (const c of rs) baseArt.set(`${c.set_id}:${numKey(String(c.collector_number))}`, c);

  console.log(`Probing ${promos.length} TCGplayer images…`);
  const out: Record<string, unknown>[] = [];
  const usedSlugs = new Set<string>();
  let ownArt = 0;
  let borrowed = 0;
  let noArt = 0;

  for (let i = 0; i < promos.length; i++) {
    const p: TcgProduct = promos[i];
    const rawNum = p.customAttributes!.number!;
    const [numer, denom = ""] = rawNum.split("/").map((s) => s.trim());
    const token = numer;
    const baseSetCode = setFromTotal(denom);

    // Art ladder: this product's own picture, then the base card's illustration
    // (labelled as borrowed), then nothing — never a placeholder pretending to
    // be the card.
    let imageUrl: string | null = null;
    let thumbUrl: string | null = null;
    let blur = "";
    let borrowedArt = false;

    if (await hasImage(p.productId)) {
      imageUrl = IMAGE(p.productId);
      thumbUrl = imageUrl;
      ownArt++;
    } else if (baseSetCode) {
      // Try the exact number, then without its variant letter — a promo of
      // "013b/298" reprints base card 013.
      const base =
        baseArt.get(`${baseSetCode}:${numKey(numer)}`) ??
        baseArt.get(`${baseSetCode}:${numKey(numer.replace(/[a-z]+$/i, ""))}`);
      if (base) {
        imageUrl = base.image;
        thumbUrl = base.image_thumb?.medium ?? base.image;
        blur = base.image_blur_data_url ?? "";
        borrowedArt = true;
        borrowed++;
      }
    }
    if (!imageUrl) noArt++;

    const treatment = treatmentOf(p.productName);
    let slug = slugify(`${p.productName} ${p.setCode} ${token}`);
    if (usedSlugs.has(slug)) slug = `${slug}-${p.productId}`;
    usedSlugs.add(slug);

    out.push({
      id: `tcg-${p.productId}`,
      slug,
      name: p.productName,
      nameNormalized: p.productName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      setCode: p.setCode,
      setName: SET_BY_CODE[p.setCode]?.name ?? p.setName,
      collectorNumber: parseInt(numer, 10) || 0,
      collectorLabel: rawNum,
      numberToken: token,
      kind: "promo",
      tcgProductId: p.productId,
      baseSetCode: baseSetCode ?? undefined,
      treatment: treatment ?? undefined,
      borrowedArt: borrowedArt || undefined,
      variant: null,
      rarity: mapRarity(p.rarityName),
      domain: mapDomain(p.customAttributes?.domain),
      type: mapType(p.customAttributes?.cardType),
      orientation: "portrait",
      energy: p.customAttributes?.energyCost ? Number(p.customAttributes.energyCost) : null,
      might: p.customAttributes?.might ? Number(p.customAttributes.might) : null,
      power: p.customAttributes?.powerCost ? Number(p.customAttributes.powerCost) : null,
      imageUrl: imageUrl ?? "",
      imageThumbUrl: thumbUrl ?? "",
      blurDataUrl: blur,
      isBanned: false,
      description: htmlToText(p.customAttributes?.description),
      flavorText: htmlToText(p.customAttributes?.flavorText),
    });

    if (i % 25 === 24) await sleep(120);
    if (i % 50 === 49) process.stdout.write(`\r  ${i + 1}/${promos.length}`);
  }

  writeFileSync(path("promo-cards.json"), JSON.stringify(out));

  const bySet: Record<string, number> = {};
  for (const c of out) bySet[c.setCode as string] = (bySet[c.setCode as string] ?? 0) + 1;

  console.log(`\nWrote ${out.length} promo printings to src/data/promo-cards.json`);
  for (const [set, n] of Object.entries(bySet).sort()) console.log(`  ${set}  ${n}`);
  console.log(`\nArt: ${ownArt} own · ${borrowed} borrowed from the base card · ${noArt} none`);
  if (usedSlugs.size !== out.length) throw new Error("slug collision — refusing to write a catalogue with duplicate URLs");
}

main().catch((e) => {
  console.error(`\n${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
