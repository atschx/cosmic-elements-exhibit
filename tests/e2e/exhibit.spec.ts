import { expect, test } from '@playwright/test';

import {
  ORIGIN_COUNTS,
  REALM_COUNTS,
  boot,
  dragKnob,
  expectSnapshot,
  litTiles,
  snapshot,
} from './helpers';

/** The console LCD shows the lit count as a zero-padded odometer: `002/118`. */
const lcdLit = (n: number) => `${String(n).padStart(3, '0')}/118`;

test.describe('lightbox wall', () => {
  test('renders all 118 elements and boots into the Big Bang notch', async ({ page }) => {
    const w = await boot(page);
    await expect(page.locator('.tile')).toHaveCount(118);
    await expect(page.locator('.tile[data-z="1"]')).toHaveClass(/\blit\b/);
    await expect(page.locator('.tile[data-z="2"]')).toHaveClass(/\blit\b/);
    await expectSnapshot(page, { axis: 'origin', stage: 0, litTiles: 2 });
    await expect(page.getByTestId('lcd-lit')).toHaveText(lcdLit(2));
    await expect(page.getByTestId('plaque-lit')).toHaveText('2');
    expect(w.errors).toEqual([]);
  });

  test('every tile has a unique atomic number and category colour', async ({ page }) => {
    await boot(page);
    const zs = await page
      .locator('.tile')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-z'))));
    expect(new Set(zs).size).toBe(118);
    expect(Math.min(...zs)).toBe(1);
    expect(Math.max(...zs)).toBe(118);
    const cats = await page
      .locator('.tile')
      .evaluateAll((els) => new Set(els.map((el) => el.getAttribute('data-cat'))).size);
    expect(cats).toBe(7);
  });
});

test.describe('origin lever', () => {
  test('keys 1–8 light the expected tiles for all eight notches', async ({ page }) => {
    await boot(page);
    for (let i = 0; i < ORIGIN_COUNTS.length; i++) {
      await page.keyboard.press(String(i + 1));
      await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[i] ?? -1);
      await expectSnapshot(page, { axis: 'origin', stage: i });
      await expect(page.getByTestId('lcd-lit')).toHaveText(lcdLit(ORIGIN_COUNTS[i] ?? -1));
    }
  });

  test('← → step one notch, Home / End jump to the ends', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('ArrowRight');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[1]);
    await page.keyboard.press('ArrowRight');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[2]);
    await page.keyboard.press('ArrowLeft');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[1]);
    await page.keyboard.press('End');
    await expect(litTiles(page)).toHaveCount(118);
    await page.keyboard.press('Home');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[0]);
    // like the legacy exhibit, the lever wraps around at both ends
    await page.keyboard.press('ArrowLeft');
    await expectSnapshot(page, { stage: 7 });
    await page.keyboard.press('ArrowRight');
    await expectSnapshot(page, { stage: 0 });
  });

  test('A toggles the panorama and returns to the previous epoch', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('3');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[2]);
    await page.keyboard.press('a');
    await expect(litTiles(page)).toHaveCount(118);
    await expect(page.locator('#btnAll')).toHaveClass(/\bon\b/);
    await page.keyboard.press('A');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[2]);
    await expectSnapshot(page, { stage: 2 });
  });

  test('the knob can be dragged with the mouse', async ({ page }) => {
    await boot(page);
    await dragKnob(page, 'railOrigin', 1);
    await expect(litTiles(page)).toHaveCount(118);
    await expectSnapshot(page, { stage: 7 });
    await dragKnob(page, 'railOrigin', 3 / 7);
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[3]);
    await expectSnapshot(page, { stage: 3 });
  });

  test('detents and tick labels are clickable', async ({ page }) => {
    await boot(page);
    await page.locator('#railOrigin .tick-lbl').nth(5).click();
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[5]);
    await page.locator('#railOrigin .detent').nth(1).click();
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[1]);
    await page.locator('#btnNext').click();
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[2]);
    await page.locator('#btnPrev').click();
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[1]);
  });

  test('the knob is a keyboard-operable slider', async ({ page }) => {
    await boot(page);
    const slider = page.locator('#railOrigin [role="slider"]');
    await expect(slider).toHaveAttribute('aria-valuemin', '0');
    await expect(slider).toHaveAttribute('aria-valuemax', '7');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[1]);
    await expect(slider).toHaveAttribute('aria-valuenow', '1');
    await page.keyboard.press('End');
    await expect(litTiles(page)).toHaveCount(118);
  });
});

test.describe('abundance lever', () => {
  test('↓ switches levers and ← → walk the six realms with the expected counts', async ({
    page,
  }) => {
    await boot(page);
    await page.keyboard.press('ArrowDown');
    await expectSnapshot(page, { axis: 'abundance', domain: 0 });
    await expect(litTiles(page)).toHaveCount(REALM_COUNTS[0]);
    await expect(page.locator('body')).toHaveAttribute('data-axis', 'abundance');
    for (let i = 1; i < REALM_COUNTS.length; i++) {
      await page.keyboard.press('ArrowRight');
      await expect(litTiles(page)).toHaveCount(REALM_COUNTS[i] ?? -1);
      await expectSnapshot(page, { axis: 'abundance', domain: i });
    }
    // ↑ hands control back to the origin lever at the remembered notch
    await page.keyboard.press('ArrowUp');
    await expectSnapshot(page, { axis: 'origin', stage: 0 });
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[0]);
  });

  test('tick labels, dragging and the plaque reflect the selected realm', async ({ page }) => {
    await boot(page);
    await page.locator('#railAbund .tick-lbl').nth(5).click();
    await expect(litTiles(page)).toHaveCount(REALM_COUNTS[5]);
    await expectSnapshot(page, { axis: 'abundance', domain: 5 });
    await expect(page.locator('body')).toHaveAttribute('data-realm', 'human');
    await expect(page.locator('#lcdRealm')).toContainText('06');
    await expect(page.locator('.tile[data-z="8"] .face.front .val')).toContainText('65%');
    await dragKnob(page, 'railAbund', 2 / 5);
    await expect(litTiles(page)).toHaveCount(REALM_COUNTS[2]);
    await expectSnapshot(page, { domain: 2 });
    await expect(page.getByTestId('plaque-lit')).toHaveText(String(REALM_COUNTS[2]));
  });
});

test.describe('console toggles', () => {
  test('Space starts and stops the auto loop', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('Space');
    await expectSnapshot(page, { auto: true });
    await expect(page.locator('#btnAuto')).toHaveClass(/\bon\b/);
    await expect(page.locator('#btnAuto')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expectSnapshot(page, { auto: false });
    await page.locator('#btnAuto').click();
    await expectSnapshot(page, { auto: true });
    await page.keyboard.press('Escape');
    await expectSnapshot(page, { auto: false });
  });

  test('M mutes and unmutes the mechanical sound', async ({ page }) => {
    await boot(page);
    await expect(page.locator('#btnAudio')).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('m');
    await expectSnapshot(page, { muted: true });
    await expect(page.locator('#btnAudio')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lcdAudio')).toHaveClass(/\boff\b/);
    await page.keyboard.press('M');
    await expectSnapshot(page, { muted: false });
    await page.locator('#btnMute').click();
    await expectSnapshot(page, { muted: true });
  });

  test('F toggles projection fullscreen', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('f');
    await expectSnapshot(page, { fullscreen: true });
    await expect(page.locator('#lcdFs')).toHaveClass(/\bon\b/);
    await page.keyboard.press('f');
    await expectSnapshot(page, { fullscreen: false });
  });

  test('P enters presentation mode: panels fold away, title + wall + levers stay', async ({
    page,
  }) => {
    await boot(page);
    await page.keyboard.press('p');
    await expectSnapshot(page, { present: true });
    await expect(page.locator('html')).toHaveClass(/\bpresent\b/);
    await expect(page.locator('#btnPresent')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.stage > .panel').first()).toBeHidden();
    await expect(page.locator('.grid')).toBeVisible();
    await expect(page.locator('#railOrigin .knob')).toBeVisible();
    await expect(page.locator('.lcd')).toBeHidden();
    // the levers still work while presenting
    await page.keyboard.press('6');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[5]);
    await page.locator('#btnPresent').click();
    await expectSnapshot(page, { present: false });
    await expect(page.locator('html')).not.toHaveClass(/\bpresent\b/);
  });
});

test.describe('telemetry HUD', () => {
  test('hovering a lit tile shows its card, clicking pins it, Esc unpins', async ({ page }) => {
    await boot(page);
    const hud = page.locator('#hud');
    await expect(hud).not.toHaveClass(/\bshow\b/);
    await page.locator('.tile[data-z="2"]').hover();
    await expect(hud).toHaveClass(/\bshow\b/);
    await expect(hud.locator('#hudSym')).toContainText('He');
    await expect(hud.locator('#hudZh')).toContainText('氦');
    await expect(hud.locator('#hudStatus')).toContainText('LIT');
    // leaving the tile hides the card again
    await page.mouse.move(5, 5);
    await expect(hud).not.toHaveClass(/\bshow\b/);
    // click → pinned
    await page.locator('.tile[data-z="2"]').click();
    await expectSnapshot(page, { pinned: 2 });
    await expect(page.locator('.tile[data-z="2"]')).toHaveClass(/\bpinned\b/);
    await expect(page.locator('.tile[data-z="2"]')).toHaveAttribute('aria-pressed', 'true');
    await page.mouse.move(5, 5);
    await expect(hud).toHaveClass(/\bshow\b/);
    await page.keyboard.press('Escape');
    await expectSnapshot(page, { pinned: null });
    await expect(hud).not.toHaveClass(/\bshow\b/);
  });

  test('a dormant tile reports DORMANT and shows realm bars for the abundance axis', async ({
    page,
  }) => {
    await boot(page);
    await page.locator('.tile[data-z="79"]').click();
    await expect(page.locator('#hud #hudStatus')).toContainText('DORMANT');
    await expect(page.locator('#hud .ab-bars .ab')).toHaveCount(6);
    await page.keyboard.press('Escape');
    await page.keyboard.press('6');
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[5]);
    await page.locator('.tile[data-z="79"]').hover();
    await expect(page.locator('#hud #hudStatus')).toContainText('LIT');
  });
});

test.describe('legend and plaque', () => {
  test('legend items jump to their epoch and the plaque follows', async ({ page }) => {
    await boot(page);
    const items = page.locator('.legend-item');
    await expect(items).toHaveCount(7);
    await items.nth(5).click();
    await expect(litTiles(page)).toHaveCount(ORIGIN_COUNTS[5]);
    await expect(items.nth(5)).toHaveClass(/\bactive\b/);
    await expect(page.locator('#lcdEpoch')).toContainText('06');
    await expect(page.locator('.plaque')).toContainText('双中子星合并');
    const s = await snapshot(page);
    expect(s.stage).toBe(5);
  });
});

test.describe('quality gates', () => {
  test('a full tour produces no console errors and no cross-origin requests', async ({
    page,
    baseURL,
  }) => {
    const w = await boot(page);
    for (let i = 1; i <= 8; i++) await page.keyboard.press(String(i));
    await page.keyboard.press('ArrowDown');
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.locator('.tile[data-z="26"]').hover();
    await page.locator('.tile[data-z="26"]').click();
    await page.keyboard.press('p');
    await page.keyboard.press('p');
    await page.keyboard.press('Escape');
    await expect(litTiles(page)).toHaveCount(118);
    expect(w.errors).toEqual([]);
    const origin = new URL(baseURL ?? 'http://localhost').origin;
    expect(w.requests.filter((u) => !u.startsWith(origin))).toEqual([]);
  });

  test('the single-file build loads with exactly one request', async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes('4174'), 'only meaningful for the dist-single server');
    const w = await boot(page);
    expect(w.requests).toEqual([baseURL]);
    const external = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link[href], script[src], img[src]')).map(
        (el) => el.getAttribute('href') ?? el.getAttribute('src'),
      ),
    );
    expect(external.filter((u) => u && !u.startsWith('data:'))).toEqual([]);
  });

  test('accessibility landmarks and names are in place', async ({ page }) => {
    await boot(page);
    await expect(page.locator('h1')).toContainText('宇宙元素起源表');
    await expect(page.locator('#grid[role="group"]')).toBeVisible();
    await expect(page.locator('[role="slider"]')).toHaveCount(2);
    await expect(page.locator('.tile[aria-label]')).toHaveCount(118);
    const unnamed = await page
      .locator('button')
      .evaluateAll((els) =>
        els
          .filter(
            (el) =>
              !el.getAttribute('aria-label') &&
              !el.getAttribute('title') &&
              !(el.textContent ?? '').trim(),
          )
          .map((el) => el.outerHTML.slice(0, 80)),
      );
    expect(unnamed).toEqual([]);
  });
});
