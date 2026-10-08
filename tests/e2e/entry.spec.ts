import { expect, test, type Page } from '@playwright/test';

const entered = '[data-wall][data-entered]';

const hiddenPosters = (page: Page) =>
  page.evaluate(
    () => [...document.querySelectorAll('[data-poster]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
  );

test('the entry sequence ends with every poster visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 4500 });
  expect(await hiddenPosters(page)).toBe(0);
  await expect(page.locator('html.entry-pending')).toHaveCount(0);
});

test('the sequence is armed again on a reload', async ({ page }, info) => {
  const wide = !['phone', 'tablet'].includes(info.project.name);
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { armed: boolean }).armed = document.documentElement.classList.contains('entry-pending');
    });
  });
  await page.goto('/');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 4500 });
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { armed: boolean }).armed)).toBe(wide);
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 4500 });
  expect(await hiddenPosters(page)).toBe(0);
});

test('posters are in flight shortly after a wide wall loads', async ({ page }, info) => {
  test.skip(['phone', 'tablet'].includes(info.project.name), 'the sequence plays on wide screens only');
  await page.goto('/');
  await expect(page.locator('html[data-ready]')).toHaveCount(1);
  await page.waitForTimeout(500);
  expect(await hiddenPosters(page)).toBeGreaterThan(0);
});

test('the wall still appears when animation frames never fire', async ({ page }) => {
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 0;
  });
  await page.goto('/');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 4500 });
  expect(await hiddenPosters(page)).toBe(0);
});

test('a direct project load does not leave the wall hidden behind it', async ({ page }) => {
  await page.goto('/work/scrub');
  await page.locator('[data-close]').click();
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 1500 });
  expect(await hiddenPosters(page)).toBe(0);
});

test('the cat is on the wall and hidden from assistive technology', async ({ page }) => {
  await page.goto('/');
  const cat = page.locator('[data-cat]');
  await expect(cat).toHaveCount(1);
  await expect(cat).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 4500 });
  // The cat stands on the top edge of a poster in the first row.
  const standing = () =>
    page.evaluate(() => {
      const cat = document.querySelector('[data-cat]')!.getBoundingClientRect();
      return [...document.querySelectorAll('[data-poster]')].some((poster) => {
        const box = poster.getBoundingClientRect();
        return Math.abs(cat.bottom - box.top) < 12 && cat.right > box.left - 60 && cat.left < box.right + 60;
      });
    });
  // She may be in the middle of a hop, so look until she lands.
  await expect.poll(standing).toBe(true);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the wall is at rest at once and the cat does not move', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(entered)).toHaveCount(1, { timeout: 1000 });
    const cat = page.locator('[data-cat]');
    const before = await cat.boundingBox();
    await page.waitForTimeout(600);
    expect(await cat.boundingBox()).toEqual(before);
  });
});

test('the cat comes to the poster under the pointer', async ({ page }, info) => {
  test.skip(['phone', 'tablet'].includes(info.project.name), 'needs a mouse');
  await page.goto('/');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 6000 });
  const gap = () =>
    page.evaluate(() => {
      const cat = document.querySelector('[data-cat]')!.getBoundingClientRect();
      const box = document.querySelector('[data-poster="omnicompiler"]')!.getBoundingClientRect();
      return Math.abs((cat.left + cat.right) / 2 - (box.left + box.right) / 2);
    });
  await page.locator('[data-poster="omnicompiler"]').hover();
  await expect.poll(gap, { timeout: 12000 }).toBeLessThan(30);
});
