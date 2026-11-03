import { describe, expect, test } from 'bun:test';

import { domains, type ChemicalElement } from '@/data';
import {
  CATEGORY_ORDER,
  DOMAINS,
  ELEMENTS,
  EPOCH_COUNT,
  PANORAMA,
  STAGES,
  categoryCounts,
  categoryToStage,
  domainAt,
  elementBySymbol,
  fmtAb,
  litListForDomain,
  litListForStage,
  lumOf,
  massOf,
  pad,
  periodGroup,
  stageAt,
  supCfg,
  supernovaBracket,
  wrap,
} from '@/model';

/** Lit counts that the legacy exhibit shows for the eight origin notches and six realms. */
const ORIGIN_COUNTS = [2, 23, 4, 22, 3, 36, 28, 118];
const REALM_COUNTS = [83, 83, 90, 12, 62, 60];

describe('catalog', () => {
  test('exposes the 118 elements with a stable Z → symbol mapping', () => {
    expect(ELEMENTS).toHaveLength(118);
    expect(ELEMENTS[0]?.symbol).toBe('H');
    expect(ELEMENTS[117]?.symbol).toBe('Og');
    expect(elementBySymbol.get('Au')?.atomicNumber).toBe(79);
    expect(elementBySymbol.get('Fe')?.nameZh).toBe('铁');
  });

  test('has seven processes in legend order and eight notches ending in the panorama', () => {
    expect(CATEGORY_ORDER).toEqual([
      'big-bang',
      'cosmic-rays',
      'low-mass-stars',
      'massive-stars',
      'white-dwarfs',
      'neutron-star-mergers',
      'human-synthesis',
    ]);
    expect(STAGES).toHaveLength(8);
    expect(PANORAMA).toBe(7);
    expect(EPOCH_COUNT).toBe(7);
    expect(stageAt(PANORAMA).cat).toBeNull();
    expect(() => stageAt(-1)).toThrow(RangeError);
    expect(() => stageAt(8)).toThrow(RangeError);
  });

  test('counts elements per process exactly like the legend badges', () => {
    expect(categoryCounts).toEqual({
      'big-bang': 2,
      'cosmic-rays': 3,
      'low-mass-stars': 22,
      'massive-stars': 23,
      'white-dwarfs': 4,
      'neutron-star-mergers': 36,
      'human-synthesis': 28,
    });
    expect(Object.values(categoryCounts).reduce((a, b) => a + b, 0)).toBe(118);
  });

  test('maps every process to the notch that lights it', () => {
    for (const key of CATEGORY_ORDER) {
      expect(stageAt(categoryToStage[key]).cat).toBe(key);
    }
  });

  test('the supernova bracket groups notches II–III (massive stars + white dwarfs)', () => {
    expect(supernovaBracket).toEqual({ first: 1, last: 2 });
    expect(stageAt(1).groupZh).toBe(stageAt(2).groupZh);
    expect(stageAt(3).groupZh).toBeUndefined();
  });
});

describe('lit lists', () => {
  test('origin notches light the expected number of tiles', () => {
    ORIGIN_COUNTS.forEach((n, i) => {
      const list = litListForStage(i);
      expect(list).toHaveLength(n);
      expect(list.every((t) => t.lum === 1 && t.val === '')).toBe(true);
    });
  });

  test('abundance realms light the expected number of tiles, brightest first', () => {
    REALM_COUNTS.forEach((n, i) => {
      const list = litListForDomain(i);
      expect(list).toHaveLength(n);
      for (let k = 1; k < list.length; k++) {
        expect(list[k - 1]?.lum ?? 0).toBeGreaterThanOrEqual(list[k]?.lum ?? 0);
      }
      expect(list.every((t) => t.lum >= 0.12 && t.lum <= 1 && t.val.length > 0)).toBe(true);
    });
  });

  test('hydrogen leads the universe and oxygen leads the human body', () => {
    expect(litListForDomain(0)[0]?.z).toBe(1);
    expect(litListForDomain(5)[0]?.z).toBe(8);
    expect(litListForDomain(5)[0]?.val).toBe('65%');
  });
});

describe('abundance maths', () => {
  test('lumOf maps 1 ppt … 100 % onto 0 … 1 and clamps outside', () => {
    expect(lumOf(1e-6)).toBeCloseTo(0, 6);
    expect(lumOf(1)).toBeCloseTo(0.5, 6);
    expect(lumOf(1e6)).toBeCloseTo(1, 6);
    expect(lumOf(1e-9)).toBe(0);
    expect(lumOf(1e9)).toBe(1);
  });

  test('fmtAb picks the unit a visitor would read', () => {
    expect(fmtAb(461_000)).toBe('46.1%');
    expect(fmtAb(28_200)).toBe('2.82%');
    expect(fmtAb(2_500)).toBe('0.25%');
    expect(fmtAb(150)).toBe('150 ppm');
    expect(fmtAb(12.34)).toBe('12.3 ppm');
    expect(fmtAb(5.2)).toBe('5.2 ppm');
    expect(fmtAb(0.0085)).toBe('8.5 ppb');
    expect(fmtAb(0.000004)).toBe('4 ppt');
    expect(fmtAb(1e-9)).toBe('痕量 trace');
  });

  test('each realm sums to ≈ 100 % by mass (crust keeps its published 100.31 %)', () => {
    for (const d of DOMAINS) {
      const sum = d.list.reduce((a, x) => a + x.ppm, 0) / 1e4;
      const [lo, hi] = d.sumRange ?? [99.8, 100.3];
      expect(sum).toBeGreaterThanOrEqual(lo);
      expect(sum).toBeLessThanOrEqual(hi);
    }
    expect(domainAt(2).key).toBe('crust');
    expect(domainAt(2).sumRange).toEqual([99.8, 100.35]);
  });

  test('massOf strips the brackets of synthetic-element mass numbers', () => {
    expect(massOf({ mass: '[294]' } as ChemicalElement)).toBe(294);
    expect(massOf({ mass: '196.97' } as ChemicalElement)).toBeCloseTo(196.97);
  });

  test('every realm defined in domains.json resolves to a ranked list', () => {
    expect(DOMAINS).toHaveLength(domains.length);
    for (const d of DOMAINS) {
      expect(d.rank.size).toBe(d.list.length);
      expect(d.rank.get(d.list[0]?.el.atomicNumber ?? -1)).toBe(1);
    }
  });
});

describe('formatting helpers', () => {
  test('supCfg raises electron counts to superscripts', () => {
    expect(supCfg('[Xe] 4f14 5d10 6s1')).toBe('[Xe] 4f¹⁴ 5d¹⁰ 6s¹');
    expect(supCfg('1s2')).toBe('1s²');
  });

  test('pad and wrap behave like the legacy helpers', () => {
    expect(pad(7)).toBe('07');
    expect(pad(2, 3)).toBe('002');
    expect(wrap(-1, 8)).toBe(7);
    expect(wrap(8, 8)).toBe(0);
    expect(wrap(3, 8)).toBe(3);
  });

  test('periodGroup reads the grid and names the f-block rows', () => {
    const fe = elementBySymbol.get('Fe');
    const ce = elementBySymbol.get('Ce');
    const u = elementBySymbol.get('U');
    if (!fe || !ce || !u) throw new Error('missing fixtures');
    expect(periodGroup(fe)).toBe('4 / 8');
    expect(periodGroup(ce)).toBe('6 / 镧系 Ln');
    expect(periodGroup(u)).toBe('7 / 锕系 An');
  });
});
