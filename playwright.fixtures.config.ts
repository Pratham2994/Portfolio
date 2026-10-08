import { defineConfig } from '@playwright/test';

// A second build that includes tests/fixtures/projects, for content edge cases.
export default defineConfig({
  testDir: 'tests/e2e-fixtures',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4174' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_FIXTURES: '1', PORT: '4174' },
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true } },
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
