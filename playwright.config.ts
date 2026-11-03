import { defineConfig } from '@playwright/test';

/**
 * End-to-end regression against both production outputs:
 *   - `dist`         multi-page site served under /cosmic-elements-exhibit/ (GitHub Pages layout):
 *                      /          the landing page (story)      → landing.spec.ts
 *                      /exhibit/  the interactive exhibit       → exhibit.spec.ts, mobile.spec.ts
 *   - `dist-single`  the self-contained single HTML file of the exhibit served from /
 * plus touch-emulated tablet / phone projects against the multi-page build.
 *
 * Uses the system Chrome (`channel: 'chrome'`) so no browser download is needed in CI.
 */
const SITE_URL = 'http://localhost:4173/cosmic-elements-exhibit/';
const EXHIBIT_URL = `${SITE_URL}exhibit/`;
const SINGLE_URL = 'http://localhost:4174/';

const chrome = {
  channel: 'chrome',
  launchOptions: {
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
  },
};
const touch = { hasTouch: true, isMobile: true };

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    colorScheme: 'dark',
  },
  projects: [
    /* ---------- exhibit ---------- */
    {
      name: 'dist-desktop',
      testMatch: /exhibit\.spec\.ts/,
      use: { ...chrome, baseURL: EXHIBIT_URL, viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'single-desktop',
      testMatch: /exhibit\.spec\.ts/,
      use: { ...chrome, baseURL: SINGLE_URL, viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'dist-laptop',
      testMatch: /exhibit\.spec\.ts/,
      use: { ...chrome, baseURL: EXHIBIT_URL, viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'ipad-landscape',
      testMatch: /mobile\.spec\.ts/,
      use: { ...chrome, ...touch, baseURL: EXHIBIT_URL, viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'ipad-portrait',
      testMatch: /mobile\.spec\.ts/,
      use: { ...chrome, ...touch, baseURL: EXHIBIT_URL, viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'iphone',
      testMatch: /mobile\.spec\.ts/,
      use: { ...chrome, ...touch, baseURL: EXHIBIT_URL, viewport: { width: 390, height: 844 } },
    },
    /* ---------- landing page ---------- */
    {
      name: 'landing-desktop',
      testMatch: /landing\.spec\.ts/,
      use: { ...chrome, baseURL: SITE_URL, viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'landing-laptop',
      testMatch: /landing\.spec\.ts/,
      use: { ...chrome, baseURL: SITE_URL, viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'landing-ipad-portrait',
      testMatch: /landing\.spec\.ts/,
      use: { ...chrome, ...touch, baseURL: SITE_URL, viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'landing-iphone',
      testMatch: /landing\.spec\.ts/,
      use: { ...chrome, ...touch, baseURL: SITE_URL, viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: [
    {
      command: 'bun run preview',
      url: SITE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'bun run preview:single',
      url: SINGLE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
