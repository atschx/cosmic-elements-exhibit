/**
 * Shapes of the JSON datasets under src/data/.
 * Editing copy, colours or abundances only ever touches the JSON — never the components.
 */

export const CATEGORY_KEYS = [
  'big-bang',
  'cosmic-rays',
  'low-mass-stars',
  'massive-stars',
  'white-dwarfs',
  'neutron-star-mergers',
  'human-synthesis',
] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const DOMAIN_KEYS = ['universe', 'solar', 'crust', 'atmosphere', 'ocean', 'human'] as const;
export type DomainKey = (typeof DOMAIN_KEYS)[number];

export const PPM_TABLES = ['crust', 'atmosphere', 'ocean', 'human'] as const;
export type PpmTable = (typeof PPM_TABLES)[number];

/** One of the seven nucleosynthesis processes (legend entry + tile colour). */
export interface Category {
  key: CategoryKey;
  nameZh: string;
  nameEn: string;
  /** CSS colour used for tiles, legend dot, HUD accent. */
  color: string;
  processZh: string;
  processEn: string;
  /** "We are made of starstuff" one-liners shown on the plaque / HUD footer. */
  starZh: string;
  starEn: string;
}

/** One notch of the 元素来源 Origin lever. `cat === null` is the Cosmic Panorama notch. */
export interface Stage {
  cat: CategoryKey | null;
  numeral: string;
  shortZh: string;
  shortEn: string;
  /** Present on the two notches the museum merges into a single "Supernova explosion" bracket. */
  groupZh?: string;
  groupEn?: string;
  timeZh: string;
  timeEn: string;
  timeShort: string;
  tagZh: string;
  tagEn: string;
  narrativeZh: string;
  narrativeEn: string;
  /** Fundamental frequency (Hz) of the sub-bass hum played when this notch ignites. */
  hum: number;
  /** Panorama-only fields (categories supply these for the other notches). */
  color?: string;
  nameZh?: string;
  nameEn?: string;
  starZh?: string;
  starEn?: string;
}

export interface ChemicalElement {
  atomicNumber: number;
  symbol: string;
  nameZh: string;
  /** Official pinyin, present only for the newest names whose glyphs older CJK fonts lack. */
  pinyin?: string;
  nameEn: string;
  /** Standard atomic weight, or "[mass number]" for elements without a stable isotope. */
  mass: string;
  /** Electron configuration in noble-gas notation, e.g. "[Ar] 3d6 4s2". */
  config: string;
  gridCol: number;
  /** 1–7 = main table periods, 8 = lanthanides, 9 = actinides. */
  gridRow: number;
  originCategory: CategoryKey;
  narrativeZh: string;
  narrativeEn: string;
}

/** How a realm's ppm-by-mass table is obtained. */
export type AbundanceSource =
  | {
      type: 'logeps';
      table: 'solar-logeps';
      /** Hydrogen mass fraction X_H. */
      xH: number;
      /** Helium mass fraction expressed in ppm (He has no usable photospheric line). */
      heliumPpm: number;
      /** Added to every log ε (Solar System is slightly metal-richer than the cosmic mean). */
      offset: number;
    }
  | { type: 'ppm'; table: PpmTable };

/** One notch of the 元素丰度 Abundance lever. */
export interface Domain {
  key: DomainKey;
  nameZh: string;
  nameEn: string;
  color: string;
  hum: number;
  /** Short LCD readout, e.g. "H+He ≈ 98%". */
  readout: string;
  unitZh: string;
  unitEn: string;
  tagZh: string;
  tagEn: string;
  narrativeZh: string;
  narrativeEn: string;
  starZh: string;
  starEn: string;
  source: AbundanceSource;
  /** Per-domain override of the mass-fraction sum tolerance (percent) used by validate:data. */
  sumRange?: [number, number];
  sumNote?: string;
}

/** symbol → value (ppm by mass, or log ε for the solar table). */
export type SymbolTable = Readonly<Record<string, number>>;
