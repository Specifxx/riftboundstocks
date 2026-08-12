import { SET_BY_CODE } from "@/lib/riftbound";

// Riot publishes no set-symbol asset this project can legitimately use, so each
// set gets a generated monogram instead: its three-letter code on a per-set
// colour. It reads as an icon in a list, and it is unambiguously ours rather
// than an imitation of an official mark.
const SET_COLOR: Record<string, string> = {
  OGN: "#4da3ff",
  OGS: "#8b8f9a",
  SFD: "#a855f7",
  UNL: "#3fb950",
};

export function SetSymbol({ code, size = 28 }: { code: string; size?: number }) {
  const color = SET_COLOR[code] ?? "#8b8f9a";
  const name = SET_BY_CODE[code]?.name ?? code;
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
