// Which catalogue cards an article talks about, found by name.
//
// RiftCompare's markdown carries no machine-readable card references — its
// embeds are bare placeholders — so cards are matched by name, tuned against
// all of its articles: full "Champion, Title" names and other multi-word
// names match anywhere (case-sensitively, whole words), Legend titles match
// on their own when they're two words or more ("Nine-Tailed Fox"), and a
// one-word name ("Scrapheap") only when the article bolds it, because plain
// one-word names are ordinary words too often ("Flash", "Challenge").
// Longest names are tried first and removed once matched, so "Ahri,
// Nine-Tailed Fox" isn't counted again as "Nine-Tailed Fox".

import { CARDS } from "./catalog";
import { championOf, rulesName } from "./champions";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let patterns: { rules: string; re: RegExp; strip: RegExp }[] | null = null;

function build() {
  const names = new Map<string, string>(); // as written → rules name
  for (const c of CARDS) {
    const r = rulesName(c);
    names.set(r, r);
    if (c.type === "Legend" && championOf(c)) {
      const title = r.split(", ").slice(1).join(", ");
      if (title.split(" ").length >= 2) names.set(title, r);
    }
  }
  return [...names.entries()]
    .sort((a, b) => b[0].length - a[0].length)
    .map(([name, rules]) => {
      const multi = name.includes(" ") || name.includes(",");
      return {
        rules,
        re: multi
          ? new RegExp(`(^|[^\\p{L}\\p{N}])${esc(name)}(?=$|[^\\p{L}\\p{N}])`, "u")
          : new RegExp(`\\*\\*${esc(name)}\\*\\*`, "u"),
        strip: new RegExp(esc(name), "g"),
      };
    });
}

/** Rules names of the cards the text mentions, in order of first mention. */
export function cardsMentioned(text: string): string[] {
  patterns ??= build();
  let rest = text.replace(/[’‘]/g, "'");
  const found: { rules: string; at: number }[] = [];
  for (const p of patterns) {
    const m = rest.match(p.re);
    if (!m || m.index === undefined) continue;
    if (!found.some((f) => f.rules === p.rules)) found.push({ rules: p.rules, at: m.index });
    rest = rest.replace(p.strip, (s) => " ".repeat(s.length)); // keep offsets for ordering
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.rules);
}
