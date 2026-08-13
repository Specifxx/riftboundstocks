import { SET_BY_CODE, type SetInfo } from "@/lib/riftbound";

// Riot publishes no set-symbol asset this project can legitimately use, so each
// set gets a generated monogram instead: its three-letter code on a colour keyed
// by set type (the same grouping as the "Set Types" filter on /sets). Keying by
// type rather than by individual code means every set — including ones added to
// SETS after this file was last touched — gets a deliberate, consistent colour
// instead of silently falling back to grey. Green/amber-green are avoided: the
// site reserves green exclusively for price gains (see tailwind.config.ts).
const SET_TYPE_COLOR: Record<SetInfo["setType"], string> = {
  "Core Set": "#4da3ff",
  Starter: "#22d3ee",
  Expansion: "#a855f7",
  Promo: "#f0b429",
};

export function SetSymbol({ code, size = 28 }: { code: string; size?: number }) {
  const set = SET_BY_CODE[code];
  const color = (set && SET_TYPE_COLOR[set.setType]) ?? "#8b8f9a";
  const name = set?.name ?? code;
  return (
    <span
      role="img"
      aria-label={`${name} set symbol`}
      className="inline-grid shrink-0 place-items-center rounded-md font-display font-bold tracking-tight"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color,
        backgroundColor: `${color}1f`,
        boxShadow: `inset 0 0 0 1px ${color}59`,
      }}
    >
      {code}
    </span>
  );
}
