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
 * The mark is drawn directly as SVG — the same hex-and-rift glyph as
 * src/components/BrandLogo.tsx, kept as a literal copy here rather than a
 * shared import because this script runs under tsx/Node with no bundler and
 * BrandLogo.tsx uses CSS custom properties (`rgb(var(--accent))`) that only
 * resolve in a browser. There is no external asset to composite — the mark is
 * pure vector, so nothing can drift out of sync with a source PNG because
 * there isn't one.
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

/** The hex-and-rift mark, `size`×`size`, gradient accent → foil. */
function markSvg(size: number): string {
  const s = size / 32; // BrandLogo.tsx's mark is drawn on a 32×32 grid
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <defs>
      <linearGradient id="g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${ACCENT}"/>
        <stop offset="1" stop-color="${FOIL}"/>
      </linearGradient>
    </defs>
    <path d="M16 1.5 29 9v14L16 30.5 3 23V9Z" fill="none" stroke="url(#g)" stroke-width="${2.1 * s}" stroke-linejoin="round"/>
    <path d="M13.5 5.5 17 13l-3.4 2.6L17.5 19 14 26.5" fill="none" stroke="url(#g)" stroke-width="${2.3 * s}" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function tile(size: number, radius: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${TILE}"/></svg>`,
  );
}

async function icon(size: number, out: string, radius: number) {
  const markSize = Math.round(size * 0.6);
  const m = await sharp(Buffer.from(markSvg(markSize))).png().toBuffer();
  await sharp(tile(size, radius))
    .composite([{ input: m, top: Math.round((size - markSize) / 2), left: Math.round((size - markSize) / 2) }])
    .png()
    .toFile(at(out));
  console.log(`  ${out}  ${size}×${size}`);
}

async function openGraph() {
  const W = 1200;
  const H = 630;
  const markSize = 220;
  const m = await sharp(Buffer.from(markSvg(markSize))).png().toBuffer();
  const text = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
      `<text x="600" y="430" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="700" letter-spacing="2" fill="${INK}">RIFT<tspan fill="${ACCENT}">LEDGER</tspan></text>` +
      `<text x="600" y="490" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#b0a6c2">Riftbound TCG price tracking, movers and market history</text>` +
      `</svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 3, background: TILE } })
    .composite([
      { input: m, top: 108, left: Math.round(W / 2 - markSize / 2) },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toFile(at("src/app/opengraph-image.png"));
  console.log(`  src/app/opengraph-image.png  ${W}×${H}`);
}

async function main() {
  console.log("Generating icons from the RiftLedger hex-and-rift mark…");
  await icon(512, "src/app/icon.png", 96);
  await icon(180, "src/app/apple-icon.png", 0);
  await openGraph();
  console.log('\nDone. Next emits the <link rel="icon"> tags from these filenames.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
