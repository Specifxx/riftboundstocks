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
 * alpha channel is the shape. That is what lets the nav recolour it with a CSS
 * mask, and it is what this script uses too: pull the alpha out, use it as the
 * mask for a solid brand-blue layer, and composite that onto the navy tile. No
 * second asset to keep in sync, and the icon can never drift from the header.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

const NAVY = "#0d1b2a";
const BLUE = { r: 0x5c, g: 0xb0, b: 0xff };

/** The R mark, recoloured to brand blue, at `size` px on transparency. */
async function mark(size: number): Promise<Buffer> {
  const src = sharp(at("public/logo-r.png")).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  const alpha = await src.clone().ensureAlpha().extractChannel("alpha").toBuffer();
  const { width, height } = await sharp(alpha).metadata();
  return sharp({
    create: { width: width!, height: height!, channels: 3, background: BLUE },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

/** Rounded navy tile. iOS squares its own corners, so this stays modest. */
function tile(size: number, radius: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${NAVY}"/></svg>`,
  );
}

/** The "S" that distinguishes RiftboundStocks from RiftCompare's bare R. */
function sGlyph(size: number, fontSize: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<text x="${size * 0.9}" y="${size * 0.34}" text-anchor="end" dominant-baseline="middle" ` +
      `font-family="Oswald, 'Arial Narrow', Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#5cb0ff">S</text>` +
      `</svg>`,
  );
}

async function icon(size: number, out: string, radius: number) {
  const markSize = Math.round(size * 0.62);
  const m = await mark(markSize);
  await sharp(tile(size, radius))
    .composite([
      // Sat slightly left of centre to leave room for the S, matching the header lockup.
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
      `<text x="600" y="430" text-anchor="middle" font-family="Oswald, 'Arial Narrow', Arial, sans-serif" font-size="78" font-weight="700" fill="#e9eef5">RIFTBOUND<tspan fill="#5cb0ff">STOCKS</tspan></text>` +
      `<text x="600" y="492" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" fill="#9eb0c4">Riftbound TCG card prices, movers and market data</text>` +
      `<text x="${600 + markSize / 2 + 14}" y="182" text-anchor="start" font-family="Oswald, 'Arial Narrow', Arial, sans-serif" font-size="72" font-weight="700" fill="#5cb0ff">S</text>` +
      `</svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
    .composite([
      { input: m, top: 104, left: Math.round(W / 2 - markSize / 2) - 18 },
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
  console.log("\nDone. Next emits the <link rel=\"icon\"> tags from these filenames.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
