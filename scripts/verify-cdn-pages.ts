/**
 * The CDN-cached detail pages (CDN_PAGES in next.config.js) are served to
 * every visitor from one cached copy, so nothing in their server import tree
 * may read cookies, request headers or the session. Walks each page's import
 * graph and fails on any of those. Run with:
 *
 *   npm run verify:cdn
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const PAGES: Record<string, string> = {
  "/card/:slug": "src/app/card/[slug]/page.tsx",
  "/champions/:slug": "src/app/champions/[slug]/page.tsx",
  "/news/:slug": "src/app/news/[slug]/page.tsx",
};
const FORBIDDEN = [/from ["']next\/headers["']/, /\bgetCurrentUser\b/, /\bdraftMode\(/];

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(ROOT, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    if (existsSync(base + ext) && !(base + ext).endsWith("/") && /\.tsx?$/.test(base + ext)) return base + ext;
  }
  return null;
}

let failures = 0;
const config = readFileSync(join(ROOT, "next.config.js"), "utf8");
for (const [route, file] of Object.entries(PAGES)) {
  const page = join(ROOT, file);
  const src = readFileSync(page, "utf8");
  if (!/export const dynamic = "force-dynamic"/.test(src)) { failures++; console.log(`FAIL ${file} is not force-dynamic`); }
  if (/export const revalidate|generateStaticParams/.test(src)) { failures++; console.log(`FAIL ${file} still uses ISR`); }
  if (!config.includes(`"${route}"`)) { failures++; console.log(`FAIL ${route} missing from CDN_PAGES`); }
  const seen = new Set<string>();
  const stack = [page];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    const text = readFileSync(f, "utf8");
    for (const re of FORBIDDEN) if (re.test(text)) { failures++; console.log(`FAIL ${route}: ${f.slice(ROOT.length + 1)} matches ${re}`); }
    for (const m of text.matchAll(/(?:import|export)[^"']*?from\s+["']([^"']+)["']/g)) {
      const next = resolveImport(f, m[1]);
      if (next) stack.push(next);
    }
  }
  console.log(`  ${route}: ${seen.size} modules scanned`);
}
if (failures) { console.log(`\n${failures} failure(s)`); process.exit(1); }
console.log("\nCDN pages read no per-visitor data.");
