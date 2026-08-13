/**
 * Build the site icons from the actual brand mark.
 *
 *   npm run seed:icons
 *
 * Outputs, all committed so no build step depends on sharp:
 *   src/app/icon.png              512×512  browser tab + Google search results
 *   src/app/apple-icon.png        180×180  iOS home screen
 *   src/app/opengraph-image.png  1200×630  link previews and rich results
 *
 * Google's favicon requirements are specific and easy to fail: the icon must be
 * square, a multiple of 48px, at a stable URL, and reachable by Googlebot. 512
 * satisfies all of that (Google downsamples). Next's file conventions emit the
 * <link rel="icon"> tags automatically from these filenames.
 *
 * The source mark (public/logo-r.png) is a FLAT COLOUR ON TRANSPARENCY, so its
 * alpha channel is the shape. That is what lets BrandLogo.tsx recolour it with
 * a CSS mask, and it is what this script uses too: pull the alpha out, use it
 * as the mask for a rasterised accent→foil gradient, and composite that onto
 * the tile alongside the "S". No second asset to keep in sync — the icon can
 * never drift from the header.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

// Void (dark) theme surface + a brightened accent/foil pair — chosen so the
// icon reads clearly in a browser tab regardless of the visitor's OS theme,
// the same reasoning most apps use a fixed-colour app icon rather than one
// that follows the page theme.
const TILE = "#14111a";
const ACCENT = "#38d6c3";
const FOIL = "#d6a85a";
const INK = "#eee9f5";

/**
 * The R mark, recoloured to the accent→foil gradient, at `size` px on
 * transparency. Rasterises a gradient-filled square, then keeps only the
 * part that overlaps the R's own alpha shape (`dest-in`: destination pixels
 * survive only where the composited source is opaque) — simpler and more
 * reliable than extracting the alpha channel and rejoining it by hand, which
 * silently produced a solid block instead of the R the one time this was
 * tried that way.
 */
async function mark(size: number): Promise<Buffer> {
  const rShape = await sharp(at("public/logo-r.png"))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const gradient = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${ACCENT}"/><stop offset="1" stop-color="${FOIL}"/></linearGradient></defs>` +
      `<rect width="${size}" height="${size}" fill="url(#g)"/></svg>`,
  );
  return sharp(gradient).composite([{ input: rShape, blend: "dest-in" }]).png().toBuffer();
}

/** Rounded tile. iOS squares its own corners, so this stays modest. */
function tile(size: number, radius: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${TILE}"/></svg>`,
  );
}

/** The "S" that distinguishes RiftboundStocks from RiftCompare's bare R. */
function sGlyph(size: number, fontSize: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<text x="${size * 0.9}" y="${size * 0.34}" text-anchor="end" dominant-baseline="middle" ` +
      `font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="700" fill="${ACCENT}">S</text>` +
      `</svg>`,
  );
}

async function icon(size: number, out: string, radius: number) {
  const markSize = Math.round(size * 0.62);
  const m = await mark(markSize);
  await sharp(tile(size, radius))
    .composite([
      // Set slightly left of centre to leave room for the S, matching the header lockup.
      { input: m, top: Math.round((size - markSize) / 2), left: Math.round((size - markSize) / 2 - size * 0.05) },
      { input: sGlyph(size, Math.round(size * 0.3)), top: 0, left: 0 },
    ])
    .png()
    .toFile(at(out));
  console.log(`  ${out}  ${size}×${size}`);
}

async function openGraph() {
  const W = 1200;
  const H = 630;
  const markSize = 210;
  const m = await mark(markSize);
  const text = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<text x="600" y="430" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="60" font-weight="700" letter-spacing="1" fill="${INK}">RIFTBOUND<tspan fill="${ACCENT}">STOCKS</tspan></text>` +
      `<text x="600" y="490" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#b0a6c2">Riftbound TCG price tracking, movers and market history</text>` +
      `<text x="${600 + markSize / 2 + 14}" y="182" text-anchor="start" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="700" fill="${ACCENT}">S</text>` +
      `</svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 3, background: TILE } })
    .composite([
      { input: m, top: 104, left: Math.round(W / 2 - markSize / 2) - 16 },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toFile(at("src/app/opengraph-image.png"));
  console.log(`  src/app/opengraph-image.png  ${W}×${H}`);
}

async function main() {
  console.log("Generating icons from public/logo-r.png…");
  await icon(512, "src/app/icon.png", 96);
  await icon(180, "src/app/apple-icon.png", 0);
  await openGraph();
  console.log('\nDone. Next emits the <link rel="icon"> tags from these filenames.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
