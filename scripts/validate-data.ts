#!/usr/bin/env bun
/**
 * `bun run validate:data`
 *
 * Structural + scientific sanity checks for the JSON datasets in src/data/:
 *   • every file parses against the runtime schema (src/data/schema.ts)
 *   • exactly 118 elements, atomic numbers 1…118 with no gaps, unique symbols and grid cells
 *   • every element references a known category; every category/stage/domain is consistent
 *   • each abundance table only names real elements and sums to 99.8–100.3 % by mass
 *     (a domain may declare `sumRange` in domains.json to document a published-data exception)
 *   • story.json (landing page) parses, and every image it references exists under public/story/
 *     at ≤ 200 KB with the declared dimensions' aspect ratio
 * Exits non-zero with a readable list of problems.
 */
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

import { DataError } from '@/data/schema';
import { story, storyFigures } from '@/data/story';
import {
  CATEGORY_KEYS,
  DOMAIN_KEYS,
  categories,
  domains,
  elements,
  essentialSymbols,
  ppmTables,
  solarLogEps,
} from '@/data';
import { DOMAINS, categoryCounts, massOf, resolveSource } from '@/model';

const problems: string[] = [];
const fail = (msg: string): void => {
  problems.push(msg);
};
const check = (ok: boolean, msg: string): void => {
  if (!ok) fail(msg);
};

const DEFAULT_SUM_RANGE: [number, number] = [99.8, 100.3];

try {
  /* ---------- elements ---------- */
  check(elements.length === 118, `elements.json: expected 118 elements, found ${elements.length}`);

  const zs = new Set<number>();
  const symbols = new Set<string>();
  const names = new Set<string>();
  const cells = new Set<string>();
  const sorted = [...elements].sort((a, b) => a.atomicNumber - b.atomicNumber);
  sorted.forEach((e, i) => {
    const tag = `elements.json Z=${e.atomicNumber} (${e.symbol})`;
    check(e.atomicNumber === i + 1, `${tag}: atomic numbers must run 1…118 without gaps`);
    check(!zs.has(e.atomicNumber), `${tag}: duplicate atomic number`);
    zs.add(e.atomicNumber);
    check(!symbols.has(e.symbol), `${tag}: duplicate symbol`);
    symbols.add(e.symbol);
    check(/^[A-Z][a-z]?$/.test(e.symbol), `${tag}: symbol must be 1–2 letters`);
    check(!names.has(e.nameEn), `${tag}: duplicate English name`);
    names.add(e.nameEn);
    const cell = `${e.gridRow}:${e.gridCol}`;
    check(!cells.has(cell), `${tag}: grid cell ${cell} already occupied`);
    cells.add(cell);
    check(Number.isFinite(massOf(e)) && massOf(e) > 0, `${tag}: mass "${e.mass}" is not numeric`);
    check(
      /^(\[[A-Z][a-z]?\] )?(\d[spdf]\d{1,2}( |$))+$/.test(`${e.config} `),
      `${tag}: odd electron configuration "${e.config}"`,
    );
    check(e.narrativeZh.length >= 20, `${tag}: narrativeZh looks truncated`);
    check(e.narrativeEn.length >= 40, `${tag}: narrativeEn looks truncated`);
    check(
      (CATEGORY_KEYS as readonly string[]).includes(e.originCategory),
      `${tag}: unknown originCategory ${e.originCategory}`,
    );
    if (e.gridRow === 8)
      check(e.atomicNumber >= 57 && e.atomicNumber <= 71, `${tag}: row 8 is lanthanides`);
    if (e.gridRow === 9)
      check(e.atomicNumber >= 89 && e.atomicNumber <= 103, `${tag}: row 9 is actinides`);
  });
  check(cells.has('1:1') && cells.has('1:18'), 'elements.json: H and He must anchor period 1');

  /* ---------- categories / stages ---------- */
  check(
    categories.length === CATEGORY_KEYS.length,
    `categories.json: expected ${CATEGORY_KEYS.length} categories`,
  );
  const catKeys = new Set(categories.map((c) => c.key));
  for (const k of CATEGORY_KEYS) check(catKeys.has(k), `categories.json: missing category ${k}`);
  for (const k of CATEGORY_KEYS) check(categoryCounts[k] > 0, `category ${k} lights no element`);

  const stagesJson = (await import('@/data')).stages;
  check(
    stagesJson.length === 8,
    `stages.json: expected 7 epochs + panorama, found ${stagesJson.length}`,
  );
  const stageCats = stagesJson
    .map((s) => s.cat)
    .filter((c): c is NonNullable<typeof c> => c !== null);
  check(
    new Set(stageCats).size === stageCats.length,
    'stages.json: a category appears on two notches',
  );
  for (const k of CATEGORY_KEYS) check(stageCats.includes(k), `stages.json: no notch lights ${k}`);
  check(
    stagesJson.filter((s) => s.cat === null).length === 1,
    'stages.json: exactly one panorama notch',
  );
  check(
    stagesJson[stagesJson.length - 1]?.cat === null,
    'stages.json: panorama must be the last notch',
  );
  const numerals = new Set(stagesJson.map((s) => s.numeral));
  check(numerals.size === stagesJson.length, 'stages.json: numerals must be unique');

  /* ---------- domains & abundance ---------- */
  check(
    domains.length === DOMAIN_KEYS.length,
    `domains.json: expected ${DOMAIN_KEYS.length} realms`,
  );
  const domainKeys = new Set(domains.map((d) => d.key));
  for (const k of DOMAIN_KEYS) check(domainKeys.has(k), `domains.json: missing realm ${k}`);

  for (const [name, table] of [
    ['solar-logeps.json', solarLogEps],
    ...Object.entries(ppmTables).map(([k, t]) => [`${k}.json`, t] as const),
  ] as const) {
    for (const sym of Object.keys(table))
      check(symbols.has(sym), `${name}: unknown element symbol ${sym}`);
  }
  for (const [name, table] of Object.entries(ppmTables)) {
    for (const [sym, v] of Object.entries(table))
      check(v > 0, `${name}.json: ${sym} must be > 0 ppm`);
  }

  for (const d of domains) {
    const table = resolveSource(d.source);
    const sumPct = Object.values(table).reduce((a, b) => a + b, 0) / 1e4;
    const [lo, hi] = d.sumRange ?? DEFAULT_SUM_RANGE;
    check(
      sumPct >= lo && sumPct <= hi,
      `${d.key}: mass fractions sum to ${sumPct.toFixed(3)} %, outside [${lo}, ${hi}] %`,
    );
    if (d.sumRange) {
      check(!!d.sumNote, `${d.key}: sumRange override needs a sumNote explaining it`);
      check(
        d.sumRange[0] <= DEFAULT_SUM_RANGE[0] + 0.5 && d.sumRange[1] <= DEFAULT_SUM_RANGE[1] + 0.5,
        `${d.key}: sumRange override is suspiciously wide`,
      );
    }
    const model = DOMAINS.find((m) => m.key === d.key);
    check(!!model && model.list.length >= 10, `${d.key}: fewer than 10 elements detected`);
  }

  /* ---------- essential ---------- */
  check(new Set(essentialSymbols).size === essentialSymbols.length, 'essential.json: duplicates');
  for (const s of essentialSymbols) check(symbols.has(s), `essential.json: unknown symbol ${s}`);
  const human = resolveSource({ type: 'ppm', table: 'human' });
  for (const s of essentialSymbols)
    check(s in human, `essential.json: ${s} is absent from human.json`);

  /* ---------- story (landing page) ---------- */
  const MAX_IMAGE_BYTES = 200 * 1024;
  const publicDir = resolve(import.meta.dirname, '../public');
  check(story.sections.length >= 3, 'story.json: expected at least 3 sections');
  check(story.exhibit.cards.length === 3, 'story.json: expected exactly 3 exhibit cards');
  check(
    story.credits.items.some((c) => c.href === story.source.url),
    'story.json: credits must link back to source.url',
  );
  const seen = new Set<string>();
  for (const f of storyFigures(story)) {
    const file = resolve(publicDir, f.src);
    let size = -1;
    try {
      size = statSync(file).size;
    } catch {
      fail(`story.json: image ${f.src} is missing from public/`);
      continue;
    }
    check(
      size <= MAX_IMAGE_BYTES,
      `story.json: ${f.src} is ${(size / 1024).toFixed(0)} KB (> 200 KB)`,
    );
    check(f.alt.length >= 10, `story.json: ${f.src} needs a descriptive alt text`);
    const ratio = f.width / f.height;
    check(
      ratio > 1.2 && ratio < 2,
      `story.json: ${f.src} has an odd aspect ratio ${ratio.toFixed(2)}`,
    );
    seen.add(f.src);
  }
  check(
    seen.size >= 3 && seen.size <= 8,
    `story.json: expected 3–8 distinct images, found ${seen.size}`,
  );
} catch (err) {
  if (err instanceof DataError) fail(err.message);
  else throw err;
}

if (problems.length) {
  console.error(`✗ validate:data found ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}

const sums = DOMAINS.map((d) => {
  const pct = [...d.ppm.values()].reduce((a, b) => a + b, 0) / 1e4;
  return `${d.key}=${pct.toFixed(2)}%`;
}).join('  ');
console.log(
  `✓ validate:data — ${elements.length} elements · ${categories.length} categories · ${DOMAINS.length} realms · lit per category: ${CATEGORY_KEYS.map((k) => `${k}=${categoryCounts[k]}`).join(' ')}`,
);
console.log(`  realm mass-fraction sums: ${sums}`);
console.log(
  `  story.json: ${story.sections.length} sections · ${storyFigures(story).length} figures · ${story.exhibit.cards.length} cards · source "${story.source.title}" (${story.source.author}, ${story.source.publishedAt})`,
);
