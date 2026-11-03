import {
  CATEGORY_KEYS,
  DOMAIN_KEYS,
  PPM_TABLES,
  type AbundanceSource,
  type Category,
  type CategoryKey,
  type ChemicalElement,
  type Domain,
  type Stage,
  type SymbolTable,
} from './types';

/**
 * Minimal runtime schema for the JSON datasets. It is deliberately dependency-free:
 * the app imports the JSON through these parsers so the TypeScript types are honest,
 * and `bun run validate:data` reuses them before applying the scientific sanity checks.
 */

export class DataError extends Error {
  constructor(
    public readonly path: string,
    message: string,
  ) {
    super(`${path}: ${message}`);
    this.name = 'DataError';
  }
}

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

function rec(v: unknown, path: string): Rec {
  if (!isRec(v)) throw new DataError(path, 'expected an object');
  return v;
}

function arr(v: unknown, path: string): unknown[] {
  if (!Array.isArray(v)) throw new DataError(path, 'expected an array');
  return v;
}

function str(o: Rec, key: string, path: string): string {
  const v = o[key];
  if (typeof v !== 'string' || v.trim() === '')
    throw new DataError(`${path}.${key}`, 'expected a non-empty string');
  return v;
}

function optStr(o: Rec, key: string, path: string): string | undefined {
  if (!(key in o) || o[key] === undefined) return undefined;
  return str(o, key, path);
}

function num(o: Rec, key: string, path: string): number {
  const v = o[key];
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new DataError(`${path}.${key}`, 'expected a finite number');
  return v;
}

function int(o: Rec, key: string, path: string, min: number, max: number): number {
  const v = num(o, key, path);
  if (!Number.isInteger(v) || v < min || v > max)
    throw new DataError(`${path}.${key}`, `expected an integer in [${min}, ${max}], got ${v}`);
  return v;
}

function oneOf<T extends string>(o: Rec, key: string, path: string, allowed: readonly T[]): T {
  const v = str(o, key, path);
  if (!(allowed as readonly string[]).includes(v))
    throw new DataError(`${path}.${key}`, `"${v}" is not one of ${allowed.join(', ')}`);
  return v as T;
}

const CSS_COLOR = /^#[0-9a-f]{6}$/i;
function color(o: Rec, key: string, path: string): string {
  const v = str(o, key, path);
  if (!CSS_COLOR.test(v)) throw new DataError(`${path}.${key}`, `"${v}" is not a #rrggbb colour`);
  return v;
}

/** Spread-safe optional assignment: keeps `exactOptionalPropertyTypes` happy. */
const opt = <K extends string, V>(key: K, v: V | undefined): Partial<Record<K, V>> =>
  v === undefined ? {} : ({ [key]: v } as Record<K, V>);

export function parseCategories(raw: unknown, path = 'categories.json'): Category[] {
  return arr(raw, path).map((item, i) => {
    const p = `${path}[${i}]`;
    const o = rec(item, p);
    return {
      key: oneOf(o, 'key', p, CATEGORY_KEYS),
      nameZh: str(o, 'nameZh', p),
      nameEn: str(o, 'nameEn', p),
      color: color(o, 'color', p),
      processZh: str(o, 'processZh', p),
      processEn: str(o, 'processEn', p),
      starZh: str(o, 'starZh', p),
      starEn: str(o, 'starEn', p),
    };
  });
}

export function parseStages(raw: unknown, path = 'stages.json'): Stage[] {
  return arr(raw, path).map((item, i) => {
    const p = `${path}[${i}]`;
    const o = rec(item, p);
    const cat: CategoryKey | null = o.cat === null ? null : oneOf(o, 'cat', p, CATEGORY_KEYS);
    const stage: Stage = {
      cat,
      numeral: str(o, 'numeral', p),
      shortZh: str(o, 'shortZh', p),
      shortEn: str(o, 'shortEn', p),
      timeZh: str(o, 'timeZh', p),
      timeEn: str(o, 'timeEn', p),
      timeShort: str(o, 'timeShort', p),
      tagZh: str(o, 'tagZh', p),
      tagEn: str(o, 'tagEn', p),
      narrativeZh: str(o, 'narrativeZh', p),
      narrativeEn: str(o, 'narrativeEn', p),
      hum: num(o, 'hum', p),
      ...opt('groupZh', optStr(o, 'groupZh', p)),
      ...opt('groupEn', optStr(o, 'groupEn', p)),
      ...opt('color', optStr(o, 'color', p)),
      ...opt('nameZh', optStr(o, 'nameZh', p)),
      ...opt('nameEn', optStr(o, 'nameEn', p)),
      ...opt('starZh', optStr(o, 'starZh', p)),
      ...opt('starEn', optStr(o, 'starEn', p)),
    };
    if (cat === null) {
      for (const k of ['color', 'nameZh', 'nameEn', 'starZh', 'starEn'] as const) {
        if (stage[k] === undefined)
          throw new DataError(`${p}.${k}`, 'required when cat is null (panorama notch)');
      }
    }
    return stage;
  });
}

export function parseElements(raw: unknown, path = 'elements.json'): ChemicalElement[] {
  return arr(raw, path).map((item, i) => {
    const p = `${path}[${i}]`;
    const o = rec(item, p);
    return {
      atomicNumber: int(o, 'atomicNumber', p, 1, 118),
      symbol: str(o, 'symbol', p),
      nameZh: str(o, 'nameZh', p),
      nameEn: str(o, 'nameEn', p),
      mass: str(o, 'mass', p),
      config: str(o, 'config', p),
      gridCol: int(o, 'gridCol', p, 1, 18),
      gridRow: int(o, 'gridRow', p, 1, 9),
      originCategory: oneOf(o, 'originCategory', p, CATEGORY_KEYS),
      narrativeZh: str(o, 'narrativeZh', p),
      narrativeEn: str(o, 'narrativeEn', p),
      ...opt('pinyin', optStr(o, 'pinyin', p)),
    };
  });
}

function parseSource(raw: unknown, path: string): AbundanceSource {
  const o = rec(raw, path);
  const type = oneOf(o, 'type', path, ['logeps', 'ppm'] as const);
  if (type === 'logeps') {
    return {
      type,
      table: oneOf(o, 'table', path, ['solar-logeps'] as const),
      xH: num(o, 'xH', path),
      heliumPpm: num(o, 'heliumPpm', path),
      offset: num(o, 'offset', path),
    };
  }
  return { type, table: oneOf(o, 'table', path, PPM_TABLES) };
}

export function parseDomains(raw: unknown, path = 'domains.json'): Domain[] {
  return arr(raw, path).map((item, i) => {
    const p = `${path}[${i}]`;
    const o = rec(item, p);
    let sumRange: [number, number] | undefined;
    if (o.sumRange !== undefined) {
      const r = arr(o.sumRange, `${p}.sumRange`);
      const [lo, hi] = r;
      if (r.length !== 2 || typeof lo !== 'number' || typeof hi !== 'number' || lo >= hi)
        throw new DataError(`${p}.sumRange`, 'expected [low, high] percentages');
      sumRange = [lo, hi];
    }
    return {
      key: oneOf(o, 'key', p, DOMAIN_KEYS),
      nameZh: str(o, 'nameZh', p),
      nameEn: str(o, 'nameEn', p),
      color: color(o, 'color', p),
      hum: num(o, 'hum', p),
      readout: str(o, 'readout', p),
      unitZh: str(o, 'unitZh', p),
      unitEn: str(o, 'unitEn', p),
      tagZh: str(o, 'tagZh', p),
      tagEn: str(o, 'tagEn', p),
      narrativeZh: str(o, 'narrativeZh', p),
      narrativeEn: str(o, 'narrativeEn', p),
      starZh: str(o, 'starZh', p),
      starEn: str(o, 'starEn', p),
      source: parseSource(o.source, `${p}.source`),
      ...opt('sumRange', sumRange),
      ...opt('sumNote', optStr(o, 'sumNote', p)),
    };
  });
}

export function parseSymbolTable(raw: unknown, path: string): SymbolTable {
  const o = rec(raw, path);
  const out: Record<string, number> = {};
  for (const [sym, v] of Object.entries(o)) {
    if (!/^[A-Z][a-z]?$/.test(sym)) throw new DataError(`${path}.${sym}`, 'not an element symbol');
    if (typeof v !== 'number' || !Number.isFinite(v))
      throw new DataError(`${path}.${sym}`, 'expected a finite number');
    out[sym] = v;
  }
  return out;
}

export function parseEssential(raw: unknown, path = 'essential.json'): string[] {
  return arr(raw, path).map((v, i) => {
    if (typeof v !== 'string' || !/^[A-Z][a-z]?$/.test(v))
      throw new DataError(`${path}[${i}]`, 'expected an element symbol');
    return v;
  });
}
