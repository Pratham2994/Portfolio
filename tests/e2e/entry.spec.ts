import { expect, test, type Page } from '@playwright/test';

const entered = '[data-wall][data-entered]';

const hiddenPosters = (page: Page) =>
  page.evaluate(
    () => [...document.querySelectorAll('[data-poster]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
  );

test('the entry sequence ends with every poster visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 3500 });
  expect(await hiddenPosters(page)).toBe(0);
  await expect(page.locator('html.entry-pending')).toHaveCount(0);
});

test('the sequence plays once per session', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 3500 });
  await page.goto('/');
  await expect(page.locator('html[data-ready]')).toHaveCount(1);
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 300 });
  expect(await hiddenPosters(page)).toBe(0);
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
  await expect(page.locator(entered)).toHaveCount(1, { timeout: 3500 });
  // The cat stands on the top edge of a poster in the first row.
  const standing = await page.evaluate(() => {
    const cat = document.querySelector('[data-cat]')!.getBoundingClientRect();
    return [...document.querySelectorAll('[data-poster]')].some((poster) => {
      const box = poster.getBoundingClientRect();
      return Math.abs(cat.bottom - box.top) < 12 && cat.right > box.left - 60 && cat.left < box.right + 60;
    });
  });
  expect(standing).toBe(true);
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
