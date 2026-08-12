// Generates one avatar SVG per fictional author into public/authors/.
//
// ABSTRACT GEOMETRY, NOT FACES — deliberately.
//
// The brief allowed synthetic AI-generated faces. This does something safer.
// A photorealistic "photo" of a person who does not exist still invites the
// reader to believe there is a person behind the byline, which is precisely the
// impression a site full of invented authors must not create; and a generated
// face can land uncomfortably close to a real person's likeness with no way to
// check. A procedurally generated mark cannot be mistaken for a photograph of
// anyone, needs no licence, and is reproducible from this file alone — no
// scraping, no third-party image service, no real person's photograph anywhere
// near it.
//
// Run: npm run seed:avatars
import { mkdirSync, writeFileSync } from "node:fs";
import { AUTHORS } from "../src/lib/content/authors";

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Initials, for a bit of identity the shapes alone can't carry. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Hues sampled around the site's navy/blue accent so the avatars sit inside the
// palette instead of fighting it.
const HUES = [206, 190, 224, 172, 250, 158];

function avatar(name: string, slug: string): string {
  const h = hash(slug);
  const hue = HUES[h % HUES.length];
  const hue2 = HUES[(h >>> 3) % HUES.length];
  const S = 96;

  const shapes: string[] = [];
  const count = 3 + Math.floor(rand(h) * 2);
  for (let i = 0; i < count; i++) {
    const r1 = rand(h ^ (i * 7919));
    const r2 = rand(h ^ (i * 104729));
    const r3 = rand(h ^ (i * 15485863));
    const cx = 14 + r1 * 68;
    const cy = 14 + r2 * 68;
    const size = 16 + r3 * 34;
    const opacity = (0.18 + r1 * 0.22).toFixed(2);
    if (i % 3 === 0) {
      shapes.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(size / 2).toFixed(1)}" fill="#fff" opacity="${opacity}"/>`);
    } else if (i % 3 === 1) {
      const rot = (r2 * 90).toFixed(1);
      shapes.push(
        `<rect x="${(cx - size / 2).toFixed(1)}" y="${(cy - size / 2).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="${(size * 0.22).toFixed(1)}" fill="#fff" opacity="${opacity}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`,
      );
    } else {
      const half = size / 2;
      shapes.push(
        `<path d="M${(cx - half).toFixed(1)} ${(cy + half).toFixed(1)}L${cx.toFixed(1)} ${(cy - half).toFixed(1)}L${(cx + half).toFixed(1)} ${(cy + half).toFixed(1)}Z" fill="#fff" opacity="${opacity}"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="Abstract avatar for the fictional author ${name}">
<title>Abstract avatar — ${name} is a fictional demo persona, not a real person</title>
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 58% 42%)"/>
<stop offset="1" stop-color="hsl(${hue2} 62% 24%)"/>
</linearGradient>
<clipPath id="c"><circle cx="48" cy="48" r="48"/></clipPath>
</defs>
<g clip-path="url(#c)">
<rect width="${S}" height="${S}" fill="url(#g)"/>
${shapes.join("\n")}
</g>
<text x="48" y="49" text-anchor="middle" dominant-baseline="central" font-family="Oswald, Arial Narrow, sans-serif" font-size="30" font-weight="600" fill="#fff" opacity="0.92" letter-spacing="1">${initials(name)}</text>
</svg>`;
}

const dir = new URL("../public/authors/", import.meta.url);
mkdirSync(dir, { recursive: true });

for (const a of AUTHORS) {
  writeFileSync(new URL(`${a.slug}.svg`, dir), avatar(a.name, a.slug));
  console.log(`wrote public/authors/${a.slug}.svg`);
}
console.log(`\n${AUTHORS.length} avatars generated. All authors are fictional demo personas.`);
