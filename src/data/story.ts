/**
 * Landing-page copy: the story behind the exhibit, the overview cards, shortcuts and credits.
 * Everything comes from story.json; this module only gives it an honest type and a runtime check
 * (`bun run validate:data` reuses `parseStory` and additionally checks the referenced images).
 */
import { CATEGORY_KEYS, type CategoryKey } from './types';
import storyJson from './story.json';
import { DataError, arr, int, oneOf, opt, optStr, rec, str, type Rec } from './schema';

export interface Bilingual {
  zh: string;
  en: string;
}

export interface StoryFigure {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: Bilingual;
}

export interface ElementQuote {
  z: number;
  symbol: string;
  name: string;
  accent: CategoryKey;
  text: string;
  /** Official pinyin, shown instead of the name when the glyph is missing from the system font. */
  pinyin?: string;
}

export type StoryBlock =
  | { type: 'p'; text: string; num?: string }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'list'; items: string[] }
  | { type: 'elements'; items: ElementQuote[] }
  | { type: 'figure'; figure: StoryFigure }
  | { type: 'video'; href: string; label: Bilingual; poster: StoryFigure };

export interface StorySection {
  id: string;
  num?: string;
  label?: Bilingual;
  title?: Bilingual;
  accent: CategoryKey;
  leadEn: string;
  blocks: StoryBlock[];
}

export interface ExhibitCard {
  id: string;
  title: Bilingual;
  text: Bilingual;
  keys: string[];
  figure: StoryFigure;
}

export interface Shortcut {
  keys: string[];
  action: Bilingual;
}

export interface CreditItem {
  label: Bilingual;
  text: Bilingual;
  href?: string;
  linkLabel?: Bilingual;
}

export interface Story {
  source: {
    title: string;
    author: string;
    account: string;
    platform: Bilingual;
    publishedAt: string;
    url: string;
  };
  links: { repo: string };
  nav: { brand: Bilingual; story: Bilingual; exhibit: Bilingual };
  hero: {
    kicker: Bilingual;
    title: Bilingual;
    lead: Bilingual;
    cta: Bilingual;
    secondary: Bilingual;
    figure: StoryFigure;
  };
  sections: StorySection[];
  exhibit: { heading: Bilingual; intro: Bilingual; cards: ExhibitCard[] };
  outro: { heading: Bilingual; text: Bilingual; cta: Bilingual; shortcutsHeading: Bilingual };
  shortcuts: Shortcut[];
  credits: { heading: Bilingual; items: CreditItem[] };
}

const BLOCK_TYPES = ['p', 'quote', 'list', 'elements', 'figure', 'video'] as const;
const HTTPS = /^https:\/\/[^\s]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function bi(o: Rec, key: string, path: string): Bilingual {
  const p = `${path}.${key}`;
  const v = rec(o[key], p);
  return { zh: str(v, 'zh', p), en: str(v, 'en', p) };
}

function optBi(o: Rec, key: string, path: string): Bilingual | undefined {
  return key in o && o[key] !== undefined ? bi(o, key, path) : undefined;
}

function url(o: Rec, key: string, path: string): string {
  const v = str(o, key, path);
  if (!HTTPS.test(v)) throw new DataError(`${path}.${key}`, `"${v}" is not an https URL`);
  return v;
}

function strList(o: Rec, key: string, path: string): string[] {
  const list = arr(o[key], `${path}.${key}`);
  return list.map((v, i) => {
    if (typeof v !== 'string' || v.trim() === '')
      throw new DataError(`${path}.${key}[${i}]`, 'expected a non-empty string');
    return v;
  });
}

function figure(raw: unknown, path: string): StoryFigure {
  const o = rec(raw, path);
  const src = str(o, 'src', path);
  if (!/^story\/[\w.-]+\.(webp|jpg|png)$/.test(src))
    throw new DataError(`${path}.src`, `"${src}" must point into public/story/`);
  return {
    src,
    width: int(o, 'width', path, 1, 8192),
    height: int(o, 'height', path, 1, 8192),
    alt: str(o, 'alt', path),
    ...opt('caption', optBi(o, 'caption', path)),
  };
}

function block(raw: unknown, path: string): StoryBlock {
  const o = rec(raw, path);
  const type = oneOf(o, 'type', path, BLOCK_TYPES);
  switch (type) {
    case 'p':
      return { type, text: str(o, 'text', path), ...opt('num', optStr(o, 'num', path)) };
    case 'quote':
      return { type, text: str(o, 'text', path), ...opt('cite', optStr(o, 'cite', path)) };
    case 'list':
      return { type, items: strList(o, 'items', path) };
    case 'elements':
      return {
        type,
        items: arr(o.items, `${path}.items`).map((item, i) => {
          const p = `${path}.items[${i}]`;
          const e = rec(item, p);
          return {
            z: int(e, 'z', p, 1, 118),
            symbol: str(e, 'symbol', p),
            name: str(e, 'name', p),
            accent: oneOf(e, 'accent', p, CATEGORY_KEYS),
            text: str(e, 'text', p),
            ...opt('pinyin', optStr(e, 'pinyin', p)),
          };
        }),
      };
    case 'figure':
      return { type, figure: figure(o.figure, `${path}.figure`) };
    case 'video':
      return {
        type,
        href: url(o, 'href', path),
        label: bi(o, 'label', path),
        poster: figure(o.poster, `${path}.poster`),
      };
  }
}

export function parseStory(raw: unknown, path = 'story.json'): Story {
  const o = rec(raw, path);

  const source = rec(o.source, `${path}.source`);
  const publishedAt = str(source, 'publishedAt', `${path}.source`);
  if (!ISO_DATE.test(publishedAt))
    throw new DataError(`${path}.source.publishedAt`, 'expected YYYY-MM-DD');

  const nav = rec(o.nav, `${path}.nav`);
  const hero = rec(o.hero, `${path}.hero`);
  const exhibit = rec(o.exhibit, `${path}.exhibit`);
  const outro = rec(o.outro, `${path}.outro`);
  const credits = rec(o.credits, `${path}.credits`);

  const sections = arr(o.sections, `${path}.sections`).map((item, i) => {
    const p = `${path}.sections[${i}]`;
    const s = rec(item, p);
    const id = str(s, 'id', p);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new DataError(`${p}.id`, 'expected a kebab-case id');
    const blocks = arr(s.blocks, `${p}.blocks`).map((b, j) => block(b, `${p}.blocks[${j}]`));
    if (blocks.length === 0) throw new DataError(`${p}.blocks`, 'a section needs content');
    return {
      id,
      accent: oneOf(s, 'accent', p, CATEGORY_KEYS),
      leadEn: str(s, 'leadEn', p),
      blocks,
      ...opt('num', optStr(s, 'num', p)),
      ...opt('label', optBi(s, 'label', p)),
      ...opt('title', optBi(s, 'title', p)),
    };
  });
  const ids = sections.map((s) => s.id);
  if (new Set(ids).size !== ids.length) throw new DataError(`${path}.sections`, 'duplicate ids');

  return {
    source: {
      title: str(source, 'title', `${path}.source`),
      author: str(source, 'author', `${path}.source`),
      account: str(source, 'account', `${path}.source`),
      platform: bi(source, 'platform', `${path}.source`),
      publishedAt,
      url: url(source, 'url', `${path}.source`),
    },
    links: { repo: url(rec(o.links, `${path}.links`), 'repo', `${path}.links`) },
    nav: {
      brand: bi(nav, 'brand', `${path}.nav`),
      story: bi(nav, 'story', `${path}.nav`),
      exhibit: bi(nav, 'exhibit', `${path}.nav`),
    },
    hero: {
      kicker: bi(hero, 'kicker', `${path}.hero`),
      title: bi(hero, 'title', `${path}.hero`),
      lead: bi(hero, 'lead', `${path}.hero`),
      cta: bi(hero, 'cta', `${path}.hero`),
      secondary: bi(hero, 'secondary', `${path}.hero`),
      figure: figure(hero.figure, `${path}.hero.figure`),
    },
    sections,
    exhibit: {
      heading: bi(exhibit, 'heading', `${path}.exhibit`),
      intro: bi(exhibit, 'intro', `${path}.exhibit`),
      cards: arr(exhibit.cards, `${path}.exhibit.cards`).map((item, i) => {
        const p = `${path}.exhibit.cards[${i}]`;
        const c = rec(item, p);
        return {
          id: str(c, 'id', p),
          title: bi(c, 'title', p),
          text: bi(c, 'text', p),
          keys: strList(c, 'keys', p),
          figure: figure(c.figure, `${p}.figure`),
        };
      }),
    },
    outro: {
      heading: bi(outro, 'heading', `${path}.outro`),
      text: bi(outro, 'text', `${path}.outro`),
      cta: bi(outro, 'cta', `${path}.outro`),
      shortcutsHeading: bi(outro, 'shortcutsHeading', `${path}.outro`),
    },
    shortcuts: arr(o.shortcuts, `${path}.shortcuts`).map((item, i) => {
      const p = `${path}.shortcuts[${i}]`;
      const s = rec(item, p);
      return { keys: strList(s, 'keys', p), action: bi(s, 'action', p) };
    }),
    credits: {
      heading: bi(credits, 'heading', `${path}.credits`),
      items: arr(credits.items, `${path}.credits.items`).map((item, i) => {
        const p = `${path}.credits.items[${i}]`;
        const c = rec(item, p);
        const href = 'href' in c && c.href !== undefined ? url(c, 'href', p) : undefined;
        return {
          label: bi(c, 'label', p),
          text: bi(c, 'text', p),
          ...opt('href', href),
          ...opt('linkLabel', optBi(c, 'linkLabel', p)),
        };
      }),
    },
  };
}

export const story: Story = parseStory(storyJson);

/** Every image the landing page references, for the validator and the preload hints. */
export function storyFigures(s: Story): StoryFigure[] {
  const out: StoryFigure[] = [s.hero.figure];
  for (const section of s.sections)
    for (const b of section.blocks) {
      if (b.type === 'figure') out.push(b.figure);
      if (b.type === 'video') out.push(b.poster);
    }
  for (const c of s.exhibit.cards) out.push(c.figure);
  return out;
}
