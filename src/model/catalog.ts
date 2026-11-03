import {
  categories,
  elements,
  essentialSymbols,
  stages,
  type Category,
  type CategoryKey,
  type ChemicalElement,
  type Stage,
} from '@/data';

export const CATEGORIES: readonly Category[] = categories;
export const CATEGORY_ORDER: readonly CategoryKey[] = categories.map((c) => c.key);
export const categoryByKey: Readonly<Record<CategoryKey, Category>> = Object.fromEntries(
  categories.map((c) => [c.key, c]),
) as Record<CategoryKey, Category>;

export const STAGES: readonly Stage[] = stages;
/** Index of the "Cosmic Panorama" notch (every tile lit). */
export const PANORAMA = stages.findIndex((s) => s.cat === null);
export const EPOCH_COUNT = stages.length - 1;

export const ELEMENTS: readonly ChemicalElement[] = elements;
export const elementByZ: ReadonlyMap<number, ChemicalElement> = new Map(
  elements.map((e) => [e.atomicNumber, e]),
);
export const elementBySymbol: ReadonlyMap<string, ChemicalElement> = new Map(
  elements.map((e) => [e.symbol, e]),
);

export const ESSENTIAL: ReadonlySet<string> = new Set(essentialSymbols);

/** Number of elements per nucleosynthesis category. */
export const categoryCounts: Readonly<Record<CategoryKey, number>> = (() => {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((k) => [k, 0])) as Record<
    CategoryKey,
    number
  >;
  for (const e of elements) counts[e.originCategory] += 1;
  return counts;
})();

/** Category → index of the lever notch that lights it. */
export const categoryToStage: Readonly<Record<CategoryKey, number>> = (() => {
  const map = {} as Record<CategoryKey, number>;
  stages.forEach((s, i) => {
    if (s.cat) map[s.cat] = i;
  });
  return map;
})();

export function stageAt(i: number): Stage {
  const s = stages[i];
  if (!s) throw new RangeError(`stage ${i} out of range`);
  return s;
}

export function stageColor(i: number): string {
  const s = stageAt(i);
  return s.cat ? categoryByKey[s.cat].color : (s.color ?? '#e2e8f0');
}
export function stageNameZh(i: number): string {
  const s = stageAt(i);
  return s.cat ? categoryByKey[s.cat].nameZh : (s.nameZh ?? s.shortZh);
}
export function stageNameEn(i: number): string {
  const s = stageAt(i);
  return s.cat ? categoryByKey[s.cat].nameEn : (s.nameEn ?? s.shortEn);
}
export function stageStar(i: number): { zh: string; en: string } {
  const s = stageAt(i);
  if (s.cat) {
    const c = categoryByKey[s.cat];
    return { zh: c.starZh, en: c.starEn };
  }
  return { zh: s.starZh ?? '', en: s.starEn ?? '' };
}

/** Indices of the first/last notch sharing the museum's merged "Supernova explosion" group. */
export const supernovaBracket: { first: number; last: number } | null = (() => {
  const idx = stages.map((s, i) => (s.groupZh ? i : -1)).filter((i) => i >= 0);
  const first = idx[0];
  const last = idx[idx.length - 1];
  return first === undefined || last === undefined ? null : { first, last };
})();
