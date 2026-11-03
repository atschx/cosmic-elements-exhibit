import { describe, expect, test } from 'bun:test';

import categoriesJson from '@/data/categories.json';
import elementsJson from '@/data/elements.json';
import {
  DataError,
  parseCategories,
  parseDomains,
  parseElements,
  parseEssential,
  parseStages,
  parseSymbolTable,
} from '@/data/schema';

const firstElement = (elementsJson as unknown[])[0];

describe('data schema', () => {
  test('accepts the shipped JSON files', () => {
    expect(parseCategories(categoriesJson)).toHaveLength(7);
    expect(parseElements(elementsJson)).toHaveLength(118);
  });

  test('rejects a non-array payload with a path in the message', () => {
    expect(() => parseCategories({}, 'categories.json')).toThrow(DataError);
    expect(() => parseCategories({}, 'categories.json')).toThrow(/categories\.json/);
  });

  test('rejects an element with a missing or malformed field', () => {
    const broken = { ...(firstElement as Record<string, unknown>) };
    delete broken.narrativeEn;
    expect(() => parseElements([broken])).toThrow(DataError);

    const badZ = { ...(firstElement as Record<string, unknown>), atomicNumber: '1' };
    expect(() => parseElements([badZ])).toThrow(DataError);

    const badCat = { ...(firstElement as Record<string, unknown>), originCategory: 'magic' };
    expect(() => parseElements([badCat])).toThrow(/originCategory/);
  });

  test('rejects stages whose category is not one of the seven processes', () => {
    expect(() =>
      parseStages([
        {
          key: 'x',
          cat: 'nope',
          zh: '',
          en: '',
          roman: 'I',
          timeZh: '',
          timeEn: '',
          starZh: '',
          starEn: '',
          subtitleZh: '',
          subtitleEn: '',
          hum: 55,
        },
      ]),
    ).toThrow(DataError);
  });

  test('rejects domains pointing at unknown abundance tables', () => {
    expect(() =>
      parseDomains([
        {
          key: 'crust',
          nameZh: '地壳',
          nameEn: 'Crust',
          source: { type: 'ppm', table: 'mars' },
        },
      ]),
    ).toThrow(DataError);
  });

  test('symbol tables must map symbols to finite numbers', () => {
    expect(parseSymbolTable({ H: 1, He: 2 }, 't.json')).toEqual({ H: 1, He: 2 });
    expect(() => parseSymbolTable({ H: 'lots' }, 't.json')).toThrow(DataError);
    expect(() => parseSymbolTable([], 't.json')).toThrow(DataError);
  });

  test('essential list is a list of symbols', () => {
    expect(parseEssential(['H', 'O'])).toEqual(['H', 'O']);
    expect(() => parseEssential([1])).toThrow(DataError);
  });
});
