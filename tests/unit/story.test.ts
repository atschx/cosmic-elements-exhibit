import { describe, expect, test } from 'bun:test';

import { DataError } from '@/data/schema';
import storyJson from '@/data/story.json';
import { parseStory, story, storyFigures } from '@/data/story';

const clone = (): Record<string, unknown> => JSON.parse(JSON.stringify(storyJson)) as never;

describe('story.json', () => {
  test('parses the shipped landing copy', () => {
    expect(story.source.author).toBe('常皓');
    expect(story.source.url).toMatch(/^https:\/\/mp\.weixin\.qq\.com\//);
    expect(story.sections.map((s) => s.id)).toEqual([
      'prologue',
      'vibe-coding',
      'details',
      'observation',
    ]);
    expect(story.exhibit.cards).toHaveLength(3);
    expect(story.shortcuts.length).toBeGreaterThanOrEqual(8);
  });

  test('lists every referenced image exactly once per use', () => {
    const figs = storyFigures(story);
    expect(figs.length).toBeGreaterThanOrEqual(6);
    for (const f of figs) {
      expect(f.src).toMatch(/^story\/[\w.-]+\.webp$/);
      expect(f.width).toBeGreaterThan(f.height);
    }
  });

  test('keeps the original article headings and the Sagan quote', () => {
    const titles = story.sections.map((s) => s.title?.zh).filter(Boolean);
    expect(titles).toEqual(['酒店里的 Vibe Coding', '藏在代码里的细节', '对这个时代的一点观察']);
    const quotes = story.sections.flatMap((s) =>
      s.blocks.filter((b) => b.type === 'quote').map((b) => b.text),
    );
    expect(quotes[0]).toContain('We are made of starstuff');
  });

  const firstSection = (doc: Record<string, unknown>): Record<string, unknown> => {
    const s = (doc.sections as Record<string, unknown>[])[0];
    if (!s) throw new Error('fixture has no sections');
    return s;
  };

  test('rejects an unknown block type, a non-https link and a bad accent', () => {
    const badBlock = clone();
    (firstSection(badBlock).blocks as unknown[]).push({ type: 'table' });
    expect(() => parseStory(badBlock)).toThrow(DataError);
    expect(() => parseStory(badBlock)).toThrow(/type/);

    const badUrl = clone();
    (badUrl.source as Record<string, unknown>).url = 'http://example.com';
    expect(() => parseStory(badUrl)).toThrow(/https URL/);

    const badAccent = clone();
    firstSection(badAccent).accent = 'plasma';
    expect(() => parseStory(badAccent)).toThrow(/accent/);
  });

  test('requires story images to live under public/story/', () => {
    const outside = clone();
    (outside.hero as { figure: Record<string, unknown> }).figure.src = 'https://cdn.example/x.jpg';
    expect(() => parseStory(outside)).toThrow(/public\/story/);
  });
});
