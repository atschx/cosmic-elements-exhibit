import { expect, test, type Page } from '@playwright/test';

import { watch } from './helpers';

/** Landing-page regression: the story reads, the CTAs lead into the exhibit, and the exhibit leads back. */

const EXHIBIT_PATH = /\/cosmic-elements-exhibit\/exhibit\/\?from=landing$/;

async function open(page: Page) {
  const w = watch(page);
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('用 AI 把上海天文馆的周期表');
  return w;
}

/** Scroll the whole document once so lazy images and reveals have all fired. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.7);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
}

test.describe('story page', () => {
  test('renders hero, four story sections, figures and credits from story.json', async ({
    page,
  }) => {
    const w = await open(page);
    await expect(page.getByTestId('hero-cta')).toBeVisible();
    await expect(page.locator('.sec')).toHaveCount(4);
    await expect(page.locator('.sec h2')).toContainText([
      /Prologue/,
      '酒店里的 Vibe Coding',
      '藏在代码里的细节',
      '对这个时代的一点观察',
    ]);
    await expect(page.locator('.pull').first()).toContainText('We are made of starstuff');
    await expect(page.locator('.element-quotes li')).toHaveCount(5);
    await expect(page.locator('.card')).toHaveCount(3);
    await expect(page.locator('.credits')).toContainText('常皓');
    await expect(page.locator('.credits a[href^="https://mp.weixin.qq.com/"]').first()).toHaveText(
      /阅读原文/,
    );
    expect(w.errors).toEqual([]);
  });

  test('every image declares its size, loads, and the page never scrolls sideways', async ({
    page,
  }) => {
    const w = await open(page);
    const imgs = page.locator('img');
    const n = await imgs.count();
    expect(n).toBeGreaterThanOrEqual(7);
    for (let i = 0; i < n; i++) {
      await expect(imgs.nth(i)).toHaveAttribute('width', /^\d+$/);
      await expect(imgs.nth(i)).toHaveAttribute('height', /^\d+$/);
      await expect(imgs.nth(i)).toHaveAttribute('alt', /.{10,}/);
    }
    await scrollThrough(page);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Array.from(document.images).filter((im) => !(im.complete && im.naturalWidth > 0))
              .length,
        ),
      )
      .toBe(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(w.errors).toEqual([]);
  });

  test('the reading column stays within 36 characters per line', async ({ page }) => {
    await open(page);
    const chars = await page.evaluate(() => {
      const p = document.querySelector('.para');
      if (!p) return 0;
      return p.getBoundingClientRect().width / parseFloat(getComputedStyle(p).fontSize);
    });
    expect(chars).toBeGreaterThan(14);
    expect(chars).toBeLessThanOrEqual(36.5);
  });

  test('all calls to action point at the exhibit, and the hero CTA actually gets there', async ({
    page,
  }) => {
    const w = await open(page);
    for (const id of ['nav-exhibit', 'hero-cta', 'outro-cta'])
      await expect(page.getByTestId(id)).toHaveAttribute('href', EXHIBIT_PATH);
    await expect(page.locator('.card-link')).toHaveCount(3);
    await page.getByTestId('hero-cta').click();
    await expect(page).toHaveURL(EXHIBIT_PATH);
    await expect(page.locator('.tile')).toHaveCount(118);
    await expect(page.locator('.tile.lit')).toHaveCount(2);
    expect(w.errors).toEqual([]);
  });

  test('the exhibit links back to the story', async ({ page }) => {
    await open(page);
    await page.getByTestId('outro-cta').click();
    await expect(page.locator('.tile')).toHaveCount(118);
    const back = page.locator('a.story-link, a.story-link-row').filter({ visible: true });
    await expect(back).toHaveCount(1);
    await back.click();
    await expect(page).toHaveURL(/\/cosmic-elements-exhibit\/$/);
    await expect(page.getByTestId('hero-cta')).toBeVisible();
  });

  test('no console errors and no cross-origin requests on a full read-through', async ({
    page,
    baseURL,
  }) => {
    const w = await open(page);
    await scrollThrough(page);
    await page.waitForLoadState('networkidle');
    expect(w.errors).toEqual([]);
    const origin = new URL(baseURL ?? 'http://localhost').origin;
    expect(w.requests.filter((u) => !u.startsWith(origin))).toEqual([]);
  });

  test('document metadata is ready for search and sharing', async ({ page, baseURL }) => {
    await open(page);
    await expect(page).toHaveTitle(/用 AI 把上海天文馆的周期表/);
    const meta = (sel: string) => page.locator(sel).first().getAttribute('content');
    expect(await meta('meta[name="description"]')).toMatch(/星尘/);
    expect(await meta('meta[property="og:title"]')).toMatch(/周期表/);
    const og = await meta('meta[property="og:image"]');
    expect(og).toMatch(/^https:\/\/.+\/story\/og-cover\.jpg$/);
    // the og:image file ships with the site (served from the same path on this preview)
    const local = new URL('story/og-cover.jpg', baseURL).toString();
    const res = await page.request.get(local);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/image\/jpeg/);
    expect(await page.locator('html').getAttribute('lang')).toBe('zh-CN');
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(
      /cosmic-elements-exhibit\/$/,
    );
  });

  test('touch targets: every call to action and nav link is at least 44 px tall', async ({
    page,
    hasTouch,
  }) => {
    test.skip(!hasTouch, 'touch projects only');
    await open(page);
    await scrollThrough(page);
    const small = await page.locator('.cta, .l-nav a, .credit-link, .play').evaluateAll((els) =>
      els
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height < 44)
        .map(
          ({ el, r }) =>
            `${el.getAttribute('class') ?? el.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`,
        ),
    );
    expect(small).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('everything is visible immediately, without reveal transitions', async ({ page }) => {
    await open(page);
    const hidden = await page
      .locator('[data-reveal]')
      .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
    expect(hidden).toBe(0);
  });
});
