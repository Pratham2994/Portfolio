import { expect, test } from '@playwright/test';

import { open } from './helpers';

const wideWithMouse = ['laptop-short', 'laptop', 'desktop', 'wide', 'portrait'];

test('sections below the wall appear after arriving from an unknown address', async ({ page }) => {
  await open(page, '/nothing/here');
  await page.getByRole('link', { name: /back to the wall/i }).click();
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  await page.locator('#you').scrollIntoViewIfNeeded();
  await expect(page.locator('#you [data-reveal]').first()).toHaveAttribute('data-seen', '');
  await expect(page.locator('#you [data-reveal]').first()).toHaveCSS('opacity', '1');
});

test('an address with odd characters does not crash the way home', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, '/work/%22');
  await page.getByRole('link', { name: /back to the wall/i }).click();
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  expect(errors).toEqual([]);
});

test('reopening by history during the close leaves no sheet over the page', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="neat"]').click();
  await expect(page.locator('#project-title')).toBeVisible();
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  // The browser's Back button closes with a sheet. Forward reopens the page while it runs.
  await page.goBack();
  await expect(page.locator('[data-ghost]')).toHaveCount(1);
  await page.goForward();
  await expect(page.locator('#project-title')).toHaveText('Neat');
  await expect(page.locator('[data-ghost]')).toHaveCount(0, { timeout: 250 });
});

test('opening another poster during the close ends on that page, with nothing left over', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="neat"]').click();
  await expect(page.locator('#project-title')).toBeVisible();
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('[data-ghost]')).toHaveCount(1);
  await page.locator('[data-poster="scrub"]').click({ force: true });
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  await expect(page.locator('[data-project]')).toHaveCount(1);
  await expect(page.locator('[data-ghost]')).toHaveCount(0);
  await expect(page.locator('main')).not.toHaveAttribute('style', /scale|opacity/);
});

test('after a resize, the close aims at where the poster is now', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="neat"]').click();
  await expect(page.locator('#project-title')).toBeVisible();
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goBack();
  const target = await page.locator('[data-ghost]').getAttribute('data-target');
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  const box = (await page.locator('[data-poster="neat"]').boundingBox())!;
  // The poster is focused after the close and drawn a little larger, so compare centres.
  const [top, right, bottom, left] = target!.match(/-?[\d.]+/g)!.map(Number);
  expect(Math.abs((left + 700 - right) / 2 - (box.x + box.width / 2))).toBeLessThan(6);
  expect(Math.abs((top + 900 - bottom) / 2 - (box.y + box.height / 2))).toBeLessThan(6);
});

test('Escape folds the page down onto its poster before it leaves', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page.locator('#project-title')).toBeVisible();
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  // Half way: the page is still there, already clipped toward the poster.
  const mid = await page.locator('[data-project]').evaluate((el) => getComputedStyle(el).clipPath);
  expect(mid).toMatch(/^inset\(/);
  expect(mid).not.toBe('inset(0px)');
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-project]')).toHaveCount(0);
  await expect(page.locator('[data-ghost]')).toHaveCount(0);
  await expect(page.locator('html[data-transitioning]')).toHaveCount(0);
});

test('the entry sequence is armed only on a wide screen with a mouse', async ({ page }, info) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { armed: boolean }).armed = document.documentElement.classList.contains('entry-pending');
    });
  });
  await page.goto('/');
  const armed = await page.evaluate(() => (window as unknown as { armed: boolean }).armed);
  expect(armed).toBe(wideWithMouse.includes(info.project.name));
});

test('posters show by themselves when scripts never load', async ({ page }) => {
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/');
  await page.waitForTimeout(5600);
  const hidden = await page.evaluate(
    () => [...document.querySelectorAll('[data-poster]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
  );
  expect(hidden).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('opening a poster never starts a transition', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => {
      const state = window as unknown as { moved: boolean };
      state.moved = false;
      new MutationObserver(() => {
        if ('transitioning' in document.documentElement.dataset) state.moved = true;
      }).observe(document.documentElement, { attributes: true });
    });
    await page.locator('[data-poster="scrub"]').click();
    await expect(page.locator('#project-title')).toBeVisible();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { moved: boolean }).moved)).toBe(false);
  });
});
