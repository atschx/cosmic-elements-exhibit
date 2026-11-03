import {
  domains,
  ppmTables,
  solarLogEps,
  type AbundanceSource,
  type ChemicalElement,
  type Domain,
  type SymbolTable,
} from '@/data';

import { ELEMENTS, elementBySymbol, PANORAMA, stageAt } from './catalog';

/** Numeric atomic mass; "[294]" style mass numbers are accepted for radioactive elements. */
export const massOf = (el: ChemicalElement): number => parseFloat(el.mass.replace(/[[\]]/g, ''));

/**
 * Universe / Solar-System tables are derived from photospheric log ε values:
 *   ppm = 10^(log ε + offset − 12) · A · X_H · 10⁶
 * Hydrogen is X_H itself and helium is supplied directly (no photospheric line).
 */
export function tableFromLogEps(
  logEps: SymbolTable,
  xH: number,
  heliumPpm: number,
  offset: number,
): SymbolTable {
  const out: Record<string, number> = {};
  for (const [sym, le] of Object.entries(logEps)) {
    const el = elementBySymbol.get(sym);
    if (!el) continue;
    out[sym] =
      sym === 'H'
        ? xH * 1e6
        : sym === 'He'
          ? heliumPpm
          : Math.pow(10, le + offset - 12) * massOf(el) * xH * 1e6;
  }
  return out;
}

export function resolveSource(source: AbundanceSource): SymbolTable {
  return source.type === 'logeps'
    ? tableFromLogEps(solarLogEps, source.xH, source.heliumPpm, source.offset)
    : ppmTables[source.table];
}

export interface DomainEntry {
  el: ChemicalElement;
  ppm: number;
}

/** A realm with its ppm table resolved, sorted and indexed. */
export interface DomainModel extends Domain {
  /** Elements present in the realm, most abundant first. */
  list: readonly DomainEntry[];
  /** atomicNumber → 1-based rank. */
  rank: ReadonlyMap<number, number>;
  /** atomicNumber → ppm by mass. */
  ppm: ReadonlyMap<number, number>;
}

export const DOMAINS: readonly DomainModel[] = domains.map((d) => {
  const table = resolveSource(d.source);
  const list: DomainEntry[] = Object.entries(table)
    .map(([sym, ppm]) => ({ el: elementBySymbol.get(sym), ppm }))
    .filter((x): x is DomainEntry => x.el !== undefined && x.ppm > 0)
    .sort((a, b) => b.ppm - a.ppm);
  return {
    ...d,
    list,
    rank: new Map(list.map((x, i) => [x.el.atomicNumber, i + 1])),
    ppm: new Map(list.map((x) => [x.el.atomicNumber, x.ppm])),
  };
});

export function domainAt(i: number): DomainModel {
  const d = DOMAINS[i];
  if (!d) throw new RangeError(`domain ${i} out of range`);
  return d;
}

/** Glow ∝ log10 of mass fraction: 1 ppt → 0, 100 % → 1. */
export const lumOf = (ppm: number): number => Math.max(0, Math.min(1, (Math.log10(ppm) + 6) / 12));

const sig = (v: number): string =>
  v >= 100
    ? String(Math.round(v))
    : v >= 10
      ? v.toFixed(1).replace(/\.0$/, '')
      : String(+v.toPrecision(2));

/** Human-readable mass fraction, e.g. "46.1%", "5.2 ppm", "8.5 ppb", "痕量 trace". */
export function fmtAb(ppm: number): string {
  if (ppm >= 1e4) return `${+(ppm / 1e4).toPrecision(3)}%`;
  if (ppm >= 1e3) return `${+(ppm / 1e4).toPrecision(2)}%`;
  if (ppm >= 1) return `${sig(ppm)} ppm`;
  if (ppm >= 1e-3) return `${sig(ppm * 1e3)} ppb`;
  if (ppm >= 1e-6) return `${sig(ppm * 1e6)} ppt`;
  return '痕量 trace';
}

/** What a lit tile should show: luminance 0–1 and the optional abundance caption. */
export interface LitTarget {
  z: number;
  lum: number;
  val: string;
}

/** Origin lever: every element of the notch's category (panorama → all 118), by Z. */
export function litListForStage(i: number): LitTarget[] {
  const cat = stageAt(i).cat;
  return ELEMENTS.filter((e) => i === PANORAMA || e.originCategory === cat).map((e) => ({
    z: e.atomicNumber,
    lum: 1,
    val: '',
  }));
}

/** Abundance lever: every element present in the realm, brightest first. */
export function litListForDomain(i: number): LitTarget[] {
  return domainAt(i).list.map((x) => ({
    z: x.el.atomicNumber,
    lum: 0.12 + 0.88 * lumOf(x.ppm),
    val: fmtAb(x.ppm),
  }));
}
