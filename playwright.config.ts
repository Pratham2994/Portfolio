import { defineConfig } from '@playwright/test';

const size = (width: number, height: number, touch = false) => ({
  viewport: { width, height },
  hasTouch: touch,
  isMobile: touch,
});

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'phone', use: size(360, 800, true) },
    { name: 'tablet', use: size(768, 1024, true) },
    { name: 'laptop-short', use: size(1366, 768) },
    { name: 'laptop', use: size(1440, 900) },
    { name: 'desktop', use: size(1920, 1080) },
    { name: 'wide', use: size(2560, 1440) },
    { name: 'portrait', use: size(1080, 1920) },
  ],
});
