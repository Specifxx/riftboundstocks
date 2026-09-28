// Where links and images inside a syndicated RiftCompare article point.
//
// The markdown's links are relative to riftcompare.com. Each is resolved to
// the closest page on THIS site when one exists — another article we carry,
// a card, champion or set we price, the movers — so a reader who follows one
// stays here; everything else goes to RiftCompare. Anything that isn't an
// http(s) URL or a site path (javascript:, data:, mailto:, bare anchors) is
// rendered as plain text: the article is another site's output.

import { RIFTCOMPARE_URL, riftcompareUrl } from "./affiliate";
import { riftcompareMap } from "./riftcompare-map";
import { setBySlug } from "./riftbound";
import type { ResolvedHref } from "@/components/Markdown";

const RC_HOST = new URL(RIFTCOMPARE_URL).host;

function toPath(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const u = new URL(href);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.host === RC_HOST || u.host === `www.${RC_HOST}` ? `${u.pathname}${u.search}` : null;
  } catch {
    return null;
  }
}

export function resolveArticleHref(href: string, carried: ReadonlySet<string>): ResolvedHref | null {
  const path = toPath(href);
  if (path == null) {
    // An absolute link to some other site: kept as-is if it's http(s).
    try {
      const u = new URL(href);
      return u.protocol === "https:" || u.protocol === "http:" ? { href: u.toString(), external: true } : null;
    } catch {
      return null;
    }
  }

  const [pathname] = path.split(/[?#]/);
  const seg = pathname.split("/").filter(Boolean);
  const map = riftcompareMap();

  if ((seg[0] === "blog" || seg[0] === "guides") && seg[1] && carried.has(seg[1])) return { href: `/news/${seg[1]}`, external: false };
  if (seg[0] === "card" && seg[1] && map.cards[seg[1]]) return { href: `/card/${map.cards[seg[1]]}`, external: false };
  if (seg[0] === "champions" && seg.length === 1) return { href: "/champions", external: false };
  if (seg[0] === "champions" && seg[1] && map.champions[seg[1]]) return { href: `/champions/${map.champions[seg[1]]}`, external: false };
  if (seg[0] === "sets" && seg.length === 1) return { href: "/sets", external: false };
  if (seg[0] === "sets" && seg[1] && setBySlug(seg[1])) return { href: `/sets/${seg[1].toLowerCase()}`, external: false };
  if (seg[0] === "movers" && seg.length === 1) return { href: "/interests", external: false };

  return { href: riftcompareUrl(path, "article"), external: true };
}

/** Images: RiftCompare-relative paths made absolute; other https images kept. */
export function resolveArticleImage(src: string): string | null {
  if (src.startsWith("/") && !src.startsWith("//")) return `${RIFTCOMPARE_URL}${src}`;
  try {
    return new URL(src).protocol === "https:" ? src : null;
  } catch {
    return null;
  }
}
