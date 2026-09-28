import Link from "next/link";
import { Fragment, type ReactNode } from "react";

// A renderer for the markdown RiftCompare publishes at /llm/<section>/<slug>
// (see lib/riftcompare-feed.ts) — and only that. It covers exactly the subset
// those articles use (surveyed across all of them): headings, paragraphs,
// bold/italic/code, links, images, bullet and numbered lists, tables,
// blockquotes and rules. Output is React elements, never an HTML string, so
// nothing in the source can inject markup; links and images go through
// `resolveHref` / `resolveImage`, which decide where each one may point.
//
// RiftCompare-only placeholders ("[[embed:0]]", "[[closeup:1]]", "[[shop]]")
// stand for live widgets that exist only on RiftCompare, and are dropped.

export interface ResolvedHref {
  href: string;
  /** Opens in a new tab and is rendered as a plain <a>, not a Next <Link>. */
  external: boolean;
}

interface Props {
  source: string;
  /** Where a link may go; null renders its text without a link. */
  resolveHref: (href: string) => ResolvedHref | null;
  /** Absolute image URL, or null to drop the image. */
  resolveImage: (src: string) => string | null;
}

type Block =
  | { t: "h"; level: 2 | 3 | 4; text: string }
  | { t: "p"; text: string }
  | { t: "img"; alt: string; src: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; start: number; items: string[] }
  | { t: "quote"; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "hr" };

const PLACEHOLDER = /\[\[[a-z]+(?::\d+)?\]\]/g;
const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  // The page renders the title and byline itself: drop the leading "# Title"
  // and the "_date · author_" line under it.
  if (lines[0]?.startsWith("# ")) i = 1;
  while (i < lines.length && !lines[i].trim()) i++;
  if (/^_[^_]+_\s*$/.test(lines[i] ?? "")) i++;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    // Blank, or nothing but widget placeholders.
    if (!trimmed.replace(PLACEHOLDER, "").trim()) {
      i++;
      continue;
    }
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push({ t: "h", level: Math.min(4, Math.max(2, h[1].length)) as 2 | 3 | 4, text: h[2] });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }
    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      blocks.push({ t: "img", alt: img[1], src: img[2] });
      i++;
      continue;
    }
    if (trimmed.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++]);
      const cells = rows.map(splitRow);
      const sep = cells.findIndex((r) => r.every((c) => /^:?-{2,}:?$/.test(c)));
      if (sep === 1) blocks.push({ t: "table", head: cells[0], rows: cells.slice(2) });
      else blocks.push({ t: "table", head: [], rows: cells.filter((_, k) => k !== sep) });
      continue;
    }
    if (trimmed.startsWith(">")) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) parts.push(lines[i++].trim().replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: parts.join(" ") });
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].trim().replace(/^[-*]\s+/, ""));
      blocks.push({ t: "ul", items });
      continue;
    }
    const ol = trimmed.match(/^(\d+)\.\s+/);
    if (ol) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].trim().replace(/^\d+\.\s+/, ""));
      blocks.push({ t: "ol", start: Number(ol[1]), items });
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|>|\||[-*]\s|\d+\.\s|-{3,}$|\*{3,}$)/.test(lines[i].trim())
    ) {
      para.push(lines[i++].trim());
    }
    if (para.length === 0) {
      i++; // a line no rule claims (a stray "*"): skip it rather than loop
      continue;
    }
    const text = para.join(" ").replace(PLACEHOLDER, "").trim();
    if (text) blocks.push({ t: "p", text });
  }
  return blocks;
}

// ── inline ───────────────────────────────────────────────────────────────────

const INLINE =
  /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|((?:^|(?<=[\s(]))[_*]([^_*\s][^_*]*?)[_*](?=$|[\s.,;:!?)]))/;

function Inline({ text, ...r }: { text: string } & Omit<Props, "source">): ReactNode {
  const out: ReactNode[] = [];
  let rest = text.replace(PLACEHOLDER, "");
  let k = 0;
  while (rest) {
    const m = rest.match(INLINE);
    if (!m || m.index === undefined) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    if (m[1]) {
      const src = r.resolveImage(m[3]);
      if (src) out.push(<img key={k++} src={src} alt={m[2]} loading="lazy" className="inline-block max-h-40 rounded" />);
    } else if (m[4]) {
      const to = r.resolveHref(m[6]);
      const label = <Inline text={m[5]} {...r} />;
      if (!to) out.push(<Fragment key={k++}>{label}</Fragment>);
      else if (to.external)
        out.push(
          <a key={k++} href={to.href} target="_blank" rel="noopener" className="text-accent hover:underline">
            {label}
          </a>,
        );
      else
        out.push(
          <Link key={k++} href={to.href} className="text-accent hover:underline">
            {label}
          </Link>,
        );
    } else if (m[7]) {
      out.push(
        <strong key={k++} className="font-semibold text-ink">
          <Inline text={m[8]} {...r} />
        </strong>,
      );
    } else if (m[9]) {
      out.push(
        <code key={k++} className="rounded bg-surface-2 px-1 font-mono text-[0.9em] text-ink">
          {m[10]}
        </code>,
      );
    } else if (m[11]) {
      out.push(
        <em key={k++}>
          <Inline text={m[12]} {...r} />
        </em>,
      );
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return <>{out}</>;
}

export function Markdown({ source, ...r }: Props) {
  const blocks = parseMarkdown(source);
  return (
    <div className="max-w-[70ch]">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h":
            return b.level === 2 ? (
              <h2 key={i} className="mt-8 font-display text-[22px] uppercase tracking-wide text-ink">
                <Inline text={b.text} {...r} />
              </h2>
            ) : (
              <h3 key={i} className="mt-6 font-display text-[17px] font-semibold text-ink">
                <Inline text={b.text} {...r} />
              </h3>
            );
          case "p":
            return (
              <p key={i} className="mt-4 text-[15px] leading-[1.75] text-ink-muted">
                <Inline text={b.text} {...r} />
              </p>
            );
          case "img": {
            const src = r.resolveImage(b.src);
            return src ? <img key={i} src={src} alt={b.alt} loading="lazy" className="mt-5 w-full rounded-xl border border-line" /> : null;
          }
          case "ul":
            return (
              <ul key={i} className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.7] text-ink-muted marker:text-ink-dim">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} {...r} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} start={b.start} className="mt-4 list-decimal space-y-1.5 pl-5 text-[15px] leading-[1.7] text-ink-muted marker:text-ink-dim">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} {...r} />
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote key={i} className="my-5 border-l-2 border-accent bg-surface-1 px-4 py-3 text-[14px] leading-relaxed text-ink-muted">
                <Inline text={b.text} {...r} />
              </blockquote>
            );
          case "table":
            return (
              <div key={i} className="mt-5 overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-left text-[13px]">
                  {b.head.length > 0 && (
                    <thead className="bg-surface-1 text-ink-dim">
                      <tr>
                        {b.head.map((c, j) => (
                          <th key={j} className="whitespace-nowrap px-3 py-2 font-medium">
                            <Inline text={c} {...r} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows.map((row, j) => (
                      <tr key={j} className="border-t border-line">
                        {row.map((c, x) => (
                          <td key={x} className="px-3 py-2 align-top text-ink-muted">
                            <Inline text={c} {...r} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={i} className="my-8 border-line" />;
        }
      })}
    </div>
  );
}
