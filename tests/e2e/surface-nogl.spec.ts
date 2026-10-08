import { expect, test } from '@playwright/test';

import { open } from './helpers';

test.use({ launchOptions: { args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] } });

test('without WebGL the wall still shows every poster and opens one', async ({ page }) => {
  await open(page, '/');
  expect(await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))).toBe(false);
  await expect(page.locator('[data-light]')).toHaveCount(0);
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  await page.locator('[data-poster="scrub"]').click();
  await expect(page.locator('#project-title')).toHaveText('Scrub');
});
