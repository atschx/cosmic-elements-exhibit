import { expect, type Page } from '@playwright/test';

import type { CosmicExhibitApi } from '@/publicApi';

/** Lit-tile counts per origin notch (I … ∞) — must match the legacy exhibit exactly. */
export const ORIGIN_COUNTS = [2, 23, 4, 22, 3, 36, 28, 118] as const;
/** Lit-tile counts per abundance realm (宇宙 · 太阳系 · 地壳 · 大气 · 海洋 · 人体). */
export const REALM_COUNTS = [83, 83, 90, 12, 62, 60] as const;

export interface Snapshot {
  axis: 'origin' | 'abundance';
  stage: number;
  domain: number;
  auto: boolean;
  muted: boolean;
  present: boolean;
  fullscreen: boolean;
  pinned: number | null;
  drawer: string | null;
  litTiles: number;
}

export interface Watch {
  errors: string[];
  requests: string[];
}

/** Collect console errors, page errors and every network request made by the page. */
export function watch(page: Page): Watch {
  const w: Watch = { errors: [], requests: [] };
  page.on('pageerror', (e) => w.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') w.errors.push(`console.error: ${m.text()}`);
  });
  page.on('request', (r) => w.requests.push(r.url()));
  return w;
}

/** Navigate to the exhibit and wait for the boot ignition (Big Bang notch → 2 lit tiles). */
export async function boot(page: Page): Promise<Watch> {
  const w = watch(page);
  await page.goto('./');
  await expect(page.locator('.tile')).toHaveCount(118);
  await expect(page.locator('.tile.lit')).toHaveCount(2);
  return w;
}

export const litTiles = (page: Page) => page.locator('.tile.lit');

export function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const api = (window as Window & { CosmicExhibit?: CosmicExhibitApi }).CosmicExhibit;
    if (!api) throw new Error('window.CosmicExhibit is not installed');
    const s = api.state;
    return {
      axis: s.axis,
      stage: s.stage,
      domain: s.domain,
      auto: s.auto,
      muted: s.muted,
      present: s.present,
      fullscreen: s.fullscreen,
      pinned: s.pinned,
      drawer: s.drawer,
      litTiles: s.litTiles,
    };
  });
}

export async function expectSnapshot(page: Page, part: Partial<Snapshot>): Promise<void> {
  await expect
    .poll(async () => {
      const s = await snapshot(page);
      return Object.fromEntries(Object.keys(part).map((k) => [k, s[k as keyof Snapshot]]));
    })
    .toEqual(part);
}

/** Drag a lever knob horizontally with the mouse to the given fraction of its rail (0 … 1). */
export async function dragKnob(page: Page, railId: string, toFraction: number): Promise<void> {
  const knob = page.locator(`#${railId} .knob`);
  const rail = page.locator(`#${railId} .rail`);
  const kb = await knob.boundingBox();
  const rb = await rail.boundingBox();
  if (!kb || !rb) throw new Error(`rail ${railId} not laid out`);
  const sx = kb.x + kb.width / 2;
  const sy = kb.y + kb.height / 2;
  const tx = rb.x + rb.width * toFraction;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(sx + ((tx - sx) * i) / 10, sy);
  }
  await page.mouse.up();
}

/** Same as dragKnob, but with a synthetic touch sequence (CDP) for the touch projects. */
export async function touchDragKnob(page: Page, railId: string, toFraction: number): Promise<void> {
  const knob = page.locator(`#${railId} .knob`);
  const rail = page.locator(`#${railId} .rail`);
  const kb = await knob.boundingBox();
  const rb = await rail.boundingBox();
  if (!kb || !rb) throw new Error(`rail ${railId} not laid out`);
  const sx = kb.x + kb.width / 2;
  const sy = kb.y + kb.height / 2;
  const tx = rb.x + rb.width * toFraction;
  const cdp = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
    });
  await send('touchStart', sx, sy);
  for (let i = 1; i <= 10; i++) {
    await send('touchMove', sx + ((tx - sx) * i) / 10, sy);
  }
  await send('touchEnd', 0, 0);
  await cdp.detach();
}
