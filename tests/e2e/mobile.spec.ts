import { expect, test, type Page } from '@playwright/test';

import {
  ORIGIN_COUNTS,
  REALM_COUNTS,
  boot,
  expectSnapshot,
  litTiles,
  touchDragKnob,
} from './helpers';

/**
 * Touch projects (iPad landscape / portrait, iPhone). The layout mode is read from the DOM:
 *   compact → legend & plaque live in drawers behind the header tabs
 *   stacked → legend & plaque sit under the wall (portrait tablets)
 */
const layoutOf = (page: Page) => page.locator('#app').getAttribute('data-layout');

test('boots on touch devices with a legible wall and no overflow of the shell', async ({
  page,
}) => {
  const w = await boot(page);
  const tile = await page.locator('.tile').first().boundingBox();
  expect(tile?.width ?? 0).toBeGreaterThanOrEqual(33);
  const vw = page.viewportSize()?.width ?? 0;
  const grid = await page.locator('.grid').boundingBox();
  const scroller = await page.locator('.wall-scroll').evaluate((el) => ({
    overflow: getComputedStyle(el).overflowX,
    scrollable: el.scrollWidth > el.clientWidth,
  }));
  // either the grid fits the screen, or it lives in a horizontal scroller (phones)
  expect((grid?.width ?? 0) <= vw + 1 || scroller.scrollable).toBe(true);
  if (scroller.scrollable) expect(scroller.overflow).toBe('auto');
  expect(w.errors).toEqual([]);
});

test('legend and plaque are reachable (drawers or stacked panels)', async ({ page }) => {
  await boot(page);
  const layout = await layoutOf(page);
  const legendTab = page.locator('.badge .drawer-tab');
  const plaqueTab = page.locator('.top-controls .drawer-tab');

  if (layout === 'stacked') {
    await expect(legendTab).toBeHidden();
    await expect(page.locator('.stage-lower .legend-item')).toHaveCount(7);
    await expect(page.locator('.stage-lower .plaque')).toBeVisible();
    await page.locator('.stage-lower .legend-item').nth(5).tap();
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[5]);
    return;
  }

  expect(layout).toBe('compact');
  await expect(page.locator('.stage > .panel')).toHaveCount(0);
  await expect(legendTab).toBeVisible();
  await legendTab.tap();
  await expectSnapshot(page, { drawer: 'legend' });
  await expect(page.locator('#drawer-legend')).toHaveClass(/\bopen\b/);
  await expect(page.locator('#drawer-legend .legend-item')).toHaveCount(7);
  // choosing a process jumps the lever and closes the drawer
  await page.locator('#drawer-legend .legend-item').nth(5).tap();
  await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[5]);
  await expectSnapshot(page, { drawer: null, stage: 5 });

  await plaqueTab.tap();
  await expectSnapshot(page, { drawer: 'plaque' });
  await expect(page.locator('#drawer-plaque .plaque')).toContainText('双中子星合并');
  await page.locator('#drawer-plaque .drawer-close').tap();
  await expectSnapshot(page, { drawer: null });
  // the scrim closes it too
  await plaqueTab.tap();
  await expectSnapshot(page, { drawer: 'plaque' });
  await page.locator('.drawer-scrim').tap({ position: { x: 10, y: 300 } });
  await expectSnapshot(page, { drawer: null });
});

test('tapping a lit tile pins a bottom-sheet card; the close key dismisses it', async ({
  page,
}) => {
  await boot(page);
  const hud = page.locator('#hud');
  await expect(hud).toHaveClass(/\bsheet\b/);
  await page.locator('.tile[data-z="2"]').tap();
  await expectSnapshot(page, { pinned: 2 });
  await expect(hud).toHaveClass(/\bshow\b/);
  await expect(hud.locator('#hudSym')).toContainText('He');
  const box = await hud.boundingBox();
  const vh = page.viewportSize()?.height ?? 0;
  expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBeGreaterThanOrEqual(vh - 1);
  const close = hud.locator('.hud-close');
  await expect(close).toBeVisible();
  const cb = await close.boundingBox();
  expect(cb?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(cb?.height ?? 0).toBeGreaterThanOrEqual(44);
  await close.tap();
  await expectSnapshot(page, { pinned: null });
  await expect(hud).not.toHaveClass(/\bshow\b/);
});

test('levers respond to touch drag and to taps on notches', async ({ page }) => {
  await boot(page);
  await touchDragKnob(page, 'railOrigin', 1);
  await expect(litTiles(page)).toHaveCount(118);
  await expectSnapshot(page, { stage: 7 });
  await page.locator('#railOrigin .tick-lbl').nth(1).tap();
  await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[1]);
  await page.locator('#railAbund .tick-lbl').nth(5).tap();
  await expect(litTiles(page)).toHaveCount(REALM_COUNTS[5]);
  await expectSnapshot(page, { axis: 'abundance', domain: 5 });
  await touchDragKnob(page, 'railAbund', 0);
  await expect(litTiles(page)).toHaveCount(REALM_COUNTS[0]);
  await expectSnapshot(page, { domain: 0 });
});

test('presentation mode keeps the console inside the viewport', async ({ page }) => {
  await boot(page);
  await page.locator('#btnPresent').tap();
  await expectSnapshot(page, { present: true });
  const vh = page.viewportSize()?.height ?? 0;
  const deck = await page.locator('.deck').boundingBox();
  expect((deck?.y ?? 0) + (deck?.height ?? 0)).toBeLessThanOrEqual(vh + 1);
  await expect(page.locator('#railAbund .knob')).toBeVisible();
  await page.locator('#btnPresent').tap();
  await expectSnapshot(page, { present: false });
});

test('interactive controls meet the 44 px touch-target minimum', async ({ page }) => {
  await boot(page);
  const small = await page.locator('button, [role="slider"]').evaluateAll((els) =>
    els
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        // tiles are sized by the wall, detents / tick labels have enlarged hit areas via ::before
        if (el.matches('.tile, .detent, .tick-lbl')) return false;
        return r.width < 44 || r.height < 44;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const name = el.id !== '' ? el.id : (el.getAttribute('class') ?? el.tagName);
        return `${name}: ${Math.round(r.width)}×${Math.round(r.height)}`;
      }),
  );
  expect(small).toEqual([]);
});
