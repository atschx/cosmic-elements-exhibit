import type { ChemicalElement } from '@/data';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** "[Ar] 3d6 4s2" → "[Ar] 3d⁶ 4s²" */
export const supCfg = (cfg: string): string =>
  cfg.replace(
    /([spdf])(\d+)/g,
    (_m, l: string, d: string) =>
      l +
      Array.from(d)
        .map((c) => SUP[+c] ?? c)
        .join(''),
  );

export const pad = (n: number, w = 2): string => String(n).padStart(w, '0');

/** Modular wrap that stays positive for negative indices. */
export const wrap = (i: number, n: number): number => ((i % n) + n) % n;

export function periodGroup(el: ChemicalElement): string {
  if (el.gridRow <= 7) return `${el.gridRow} / ${el.gridCol}`;
  return el.gridRow === 8 ? '6 / 镧系 Ln' : '7 / 锕系 An';
}

/** CSS grid row for an element: the f-block sits below a thin spacer row (row 8). */
export const gridRowOf = (el: ChemicalElement): number =>
  el.gridRow < 8 ? el.gridRow : el.gridRow + 1;
