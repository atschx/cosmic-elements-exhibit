import type { ChemicalElement } from '@/data';

/**
 * The newest element names (𬬻 𬭊 𬭳 … 鿬 鿫) live in CJK Ext-E / late URO blocks that older
 * system fonts lack. Probe each glyph against the page font; if it would render as tofu,
 * fall back to the official pinyin so the lightbox never shows an empty box.
 */
const glyphOk: (ch: string) => boolean = (() => {
  const cache = new Map<string, boolean>();
  let probe: ((ch: string) => boolean) | null = null;
  try {
    if (typeof document !== 'undefined') {
      const cv = document.createElement('canvas');
      cv.width = 36;
      cv.height = 36;
      const x = cv.getContext('2d', { willReadFrequently: true });
      if (x) {
        const font = `26px ${getComputedStyle(document.body).fontFamily}`;
        const render = (ch: string): string => {
          x.clearRect(0, 0, 36, 36);
          x.font = font;
          x.textBaseline = 'top';
          x.fillStyle = '#fff';
          x.fillText(ch, 3, 3);
          return x.getImageData(0, 0, 36, 36).data.join(',');
        };
        const notdef = [render('\u0378'), render('\u{F0000}'), render('\u{E0080}')];
        probe = (ch) => {
          const r = render(ch);
          return !notdef.includes(r) && /[1-9]/.test(r);
        };
      }
    }
  } catch {
    probe = null;
  }
  return (ch) => {
    if (!probe) return true;
    let ok = cache.get(ch);
    if (ok === undefined) {
      ok = probe(ch);
      cache.set(ch, ok);
    }
    return ok;
  };
})();

const displayCache = new WeakMap<ChemicalElement, string>();

/** Chinese name as it should be painted — pinyin when the glyph would be tofu. */
export function zhDisplay(el: ChemicalElement): string {
  let v = displayCache.get(el);
  if (v === undefined) {
    v = !el.pinyin || Array.from(el.nameZh).every(glyphOk) ? el.nameZh : el.pinyin;
    displayCache.set(el, v);
  }
  return v;
}

export const zhFallbackUsed = (el: ChemicalElement): boolean => zhDisplay(el) !== el.nameZh;
