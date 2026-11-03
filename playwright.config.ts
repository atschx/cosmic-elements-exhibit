import { defineConfig } from '@playwright/test';

/**
 * End-to-end regression against both production outputs:
 *   - `dist`         multi-file site served under /cosmic-elements-exhibit/ (GitHub Pages layout)
 *   - `dist-single`  the self-contained single HTML file served from /
 * plus touch-emulated tablet / phone projects against the multi-file build.
 *
 * Uses the system Chrome (`channel: 'chrome'`) so no browser download is needed in CI.
 */
const DIST_URL = 'http://localhost:4173/cosmic-elements-exhibit/';
const SINGLE_URL = 'http://localhost:4174/';

const chrome = {
  channel: 'chrome',
  launchOptions: {
    args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
  },
};

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
    {
      name: 'dist-desktop',
      testIgnore: /mobile\.spec\.ts/,
      use: { ...chrome, baseURL: DIST_URL, viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'single-desktop',
      testIgnore: /mobile\.spec\.ts/,
      use: { ...chrome, baseURL: SINGLE_URL, viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'dist-laptop',
      testMatch: /exhibit\.spec\.ts/,
      use: { ...chrome, baseURL: DIST_URL, viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'ipad-landscape',
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...chrome,
        baseURL: DIST_URL,
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'ipad-portrait',
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...chrome,
        baseURL: DIST_URL,
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'iphone',
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...chrome,
        baseURL: DIST_URL,
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: [
    {
      command: 'bun run preview',
      url: DIST_URL,
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
