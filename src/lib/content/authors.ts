// ─────────────────────────────────────────────────────────────────────────────
// THESE AUTHORS ARE FICTIONAL. THEY ARE NOT REAL PEOPLE.
// ─────────────────────────────────────────────────────────────────────────────
// Every persona below was invented to populate an editorial demo. None of them
// exists, none is based on a real person, and no real writer's name, likeness,
// biography or work is used. The bylines exist so the article templates have
// something to render — they are not attribution.
//
// Avatars are PROCEDURALLY GENERATED ABSTRACT SVG (see scripts/gen-avatars.ts),
// deliberately not faces. Photographs of real people are out of the question,
// and even synthetic photorealistic faces were rejected: a generated "photo"
// invites a reader to believe there is a person behind the byline, which is the
// exact impression this file must not create. A geometric mark cannot be
// mistaken for a photograph of anyone.
//
// See also: /about, which states all of this to readers rather than only here.

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  /**
   * Not a person at all — the site's own automated desk.
   *
   * Data reports are arithmetic over the price snapshot, so attributing them to
   * one of the invented personas below would be worse than the personas
   * themselves: it would put real analysis under a fabricated human byline.
   * This byline says plainly that a script wrote it.
   */
  isDesk?: boolean;
}

export const AUTHORS: Author[] = [
  {
    slug: "data-desk",
    name: "RiftLedger Data Desk",
    role: "Automated analysis",
    bio: "Not a person. Data reports are generated from the daily TCGplayer price snapshot, and every figure in them is re-derived from the data by scripts/verify-reports.ts before the site builds. Where a number appears, it was measured — not estimated, and not written by hand.",
    avatar: "/authors/data-desk.svg",
    isDesk: true,
  },
  {
    slug: "mira-castellan",
    name: "Mira Castellan",
    role: "Markets Editor",
    bio: "Covers set rotations and the long tail of the singles market. Writes the weekly movers column and is unreasonably interested in what happens to a card's price the week after it stops being good.",
    avatar: "/authors/mira-castellan.svg",
  },
  {
    slug: "devon-okafor",
    name: "Devon Okafor",
    role: "Meta Analyst",
    bio: "Tracks tournament results and turns them into buy signals. Believes most price spikes are visible three days early in decklists if you bother to read them.",
    avatar: "/authors/devon-okafor.svg",
  },
  {
    slug: "priya-raghunathan",
    name: "Priya Raghunathan",
    role: "Set Reviews",
    bio: "Reviews every set at release and again ninety days later, on the theory that the second review is the honest one. Focuses on Showcase treatments and the economics of chase rarities.",
    avatar: "/authors/priya-raghunathan.svg",
  },
  {
    slug: "tobias-lindqvist",
    name: "Tobias Lindqvist",
    role: "Speculation",
    bio: "Writes the speculation column and keeps a public record of the calls that went wrong. Prefers boring, liquid cards to lottery tickets.",
    avatar: "/authors/tobias-lindqvist.svg",
  },
  {
    slug: "renata-suarez",
    name: "Renata Suárez",
    role: "Hidden Gems",
    bio: "Digs through commons and uncommons for cards doing more work than their price suggests. Has strong opinions about which bulk is not actually bulk.",
    avatar: "/authors/renata-suarez.svg",
  },
];

const BY_SLUG = new Map(AUTHORS.map((a) => [a.slug, a]));

export function authorBySlug(slug: string): Author | undefined {
  return BY_SLUG.get(slug);
}

/** Falls back to the first persona so a typo'd byline can't crash an article page. */
export function authorOr(slug: string): Author {
  return BY_SLUG.get(slug) ?? AUTHORS[0];
}
