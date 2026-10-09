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
  await expect(page.locator('[data-wall][data-fallen]')).toHaveCount(0, { timeout: 12000 });
  // Every sheet is back on its mark: nothing the drop set is left on it.
  const leftovers = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-poster], [data-piece]')].filter((el) => el.style.transform || el.style.translate || el.style.rotate || el.style.scale).length,
  );
  expect(leftovers).toBe(0);
  await expect.poll(async () => Math.abs((await scrub.boundingBox())!.y - before.y)).toBeLessThan(12);
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

test('a small hint for the secret sits in the corner', async ({ page }, info) => {
  await open(page, '/');
  const hint = page.locator('[data-wall] p[aria-hidden]', { hasText: 'meow' });
  await expect(hint).toBeVisible({ visible: wide.includes(info.project.name) });
});

test('the cat falls with the wall, and jumps back when it is hung again', async ({ page }, info) => {
  test.skip(!wide.includes(info.project.name), 'the wide wall only');
  await open(page, '/');
  const cat = page.locator('[data-cat]');
  const home = (await cat.boundingBox())!.y;
  await page.locator('[data-lever]').click();
  // She hangs for a moment, then lands low on the pile.
  await expect.poll(async () => (await cat.boundingBox())!.y - home, { timeout: 4000 }).toBeGreaterThan(200);
  await expect(page.locator('[data-wall][data-fallen]')).toHaveCount(0, { timeout: 12000 });
  // Back on a poster edge in the top row.
  const standing = () =>
    page.evaluate(() => {
      const box = document.querySelector('[data-cat]')!.getBoundingClientRect();
      return [...document.querySelectorAll('[data-poster], [data-piece]')].some((sheet) => {
        const edge = sheet.getBoundingClientRect();
        return Math.abs(box.bottom - edge.top) < 14 && box.right > edge.left - 60 && box.left < edge.right + 60;
      });
    });
  await expect.poll(standing, { timeout: 6000 }).toBe(true);
});
