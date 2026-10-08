import { expect, test } from '@playwright/test';

import { open } from './helpers';

const html = 'html[data-transitioning]';

test('opening a poster runs a transition that ends with the page in place', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page.locator(html)).toHaveCount(1);
  await expect(page.locator(html)).toHaveCount(0);
  const state = await page.locator('[data-project]').evaluate((el) => ({
    clip: getComputedStyle(el).clipPath,
    hidden: [...el.querySelectorAll('[data-in]')].filter((n) => getComputedStyle(n).opacity !== '1').length,
  }));
  expect(state).toEqual({ clip: 'none', hidden: 0 });
});

test('closing runs a transition and leaves the wall as it was', async ({ page }) => {
  await open(page, '/work/neat');
  await page.keyboard.press('Escape');
  await expect(page.locator(html)).toHaveCount(1);
  await expect(page.locator(html)).toHaveCount(0);
  const wall = await page.locator('main').evaluate((el) => ({
    transform: getComputedStyle(el).transform,
    opacity: getComputedStyle(el).opacity,
  }));
  expect(wall).toEqual({ transform: 'none', opacity: '1' });
  await expect(page.locator('[data-ghost]')).toHaveCount(0);
});

test('rapid open, back, forward, back leaves a state that matches the URL', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  // Each step lands while the previous transition is still running.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(html)).toHaveCount(0);
  await expect(page.locator('[data-project]')).toHaveCount(0);
  await expect(page.locator('[data-ghost]')).toHaveCount(0);
  await expect(page.locator('[data-poster="scrub"]')).toBeVisible();
});

test('a second poster click during the transition still ends on one open page', async ({ page }) => {
  await open(page, '/');
  const poster = page.locator('[data-poster="scrub"]');
  await poster.click();
  await poster.click({ force: true, noWaitAfter: true }).catch(() => {});
  await expect(page.locator(html)).toHaveCount(0);
  await expect(page.locator('[data-project]')).toHaveCount(1);
  await expect(page).toHaveURL(/\/work\/scrub$/);
});

test('closing after a resize returns the poster to its new place', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="neat"]').click();
  await expect(page.locator('#project-title')).toBeVisible();
  await page.setViewportSize({ width: 700, height: 900 });
  await page.keyboard.press('Escape');
  await expect(page.locator(html)).toHaveCount(0);
  const box = await page.locator('[data-poster="neat"]').boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 700).toBe(true);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a poster opens with a cut', async ({ page }) => {
    await open(page, '/');
    await page.locator('[data-poster="scrub"]').click();
    await expect(page.locator('#project-title')).toBeVisible({ timeout: 300 });
    await expect(page.locator(html)).toHaveCount(0);
  });
});
