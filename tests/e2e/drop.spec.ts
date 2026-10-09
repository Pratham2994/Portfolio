import { expect, test } from '@playwright/test';

import { open } from './helpers';

const wide = ['laptop-short', 'laptop', 'desktop', 'wide'];

test('the lever shows only on the wide wall', async ({ page }, info) => {
  await open(page, '/');
  await expect(page.locator('[data-lever]')).toBeVisible({ visible: wide.includes(info.project.name) });
});

test('pressing it drops every sheet, then the wall hangs itself again', async ({ page }, info) => {
  test.skip(!wide.includes(info.project.name), 'the wide wall only');
  await open(page, '/');
  const scrub = page.locator('[data-poster="scrub"]');
  // The pointer tilts the view, so park it on the lever before measuring.
  await page.locator('[data-lever]').hover();
  await page.waitForTimeout(900);
  const before = (await scrub.boundingBox())!;
  await page.locator('[data-lever]').click();
  await expect(page.locator('[data-wall][data-fallen]')).toHaveCount(1);
  // Mid-fall the poster is well below where it hangs.
  await expect.poll(async () => (await scrub.boundingBox())!.y - before.y, { timeout: 3000 }).toBeGreaterThan(40);
  await expect(page.locator('[data-wall][data-fallen]')).toHaveCount(0, { timeout: 8000 });
  await page.locator('[data-lever]').hover();
  await page.waitForTimeout(900);
  const after = (await scrub.boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeLessThan(10);
  expect(Math.abs(after.y - before.y)).toBeLessThan(10);
  // A poster still opens afterwards.
  await scrub.click();
  await expect(page.locator('#project-title')).toHaveText('Scrub');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('there is no lever', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('[data-lever]')).toBeHidden();
  });
});
