import { expect, test } from '@playwright/test';

import { open } from './helpers';

test('poster opens its project and Escape returns to the wall', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page.locator('#project-title')).toHaveText('Scrub');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-project]')).toHaveCount(0);
});

test('direct load shows the page, and close leads home', async ({ page }) => {
  await open(page, '/work/neat');
  await expect(page.locator('#project-title')).toHaveText('Neat');
  await expect(page).toHaveTitle('Neat - Pratham Panchal');
  await page.locator('[data-close]').click();
  await expect(page).toHaveURL(/\/$/);
});

test('next and previous walk the wall in order and wrap', async ({ page }) => {
  await open(page, '/work/algomotion');
  await page.locator('[data-next]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await page.locator('[data-prev]').click();
  await expect(page).toHaveURL(/\/work\/algomotion$/);
});

test('the next project waits at the end of the page, and the arrow keys turn the pages', async ({ page }) => {
  await open(page, '/work/algomotion');
  await expect(page.locator('[data-next]')).toContainText('Scrub');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page.locator('#project-title')).toHaveText('Scrub');
  // The sheet that covered the turn is gone once the new page is in.
  await expect(page.locator('[data-ghost]')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\/work\/algomotion$/);
});

test('unknown slug shows the not-found page with a way home', async ({ page }) => {
  await open(page, '/work/nope');
  await expect(page.getByRole('heading', { name: /not on the wall/i })).toBeVisible();
  await page.getByRole('link', { name: /back to the wall/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('keyboard: Enter on a poster opens it and focus lands on the title', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#project-title')).toBeFocused();
});

test('closing returns focus to the poster, and the wall is inert while a page is open', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="neat"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-poster="neat"]')).toBeFocused();
});

test('a project page has no horizontal overflow', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  await expect(page.locator('#project-title')).toBeVisible();
  const overflow = await page.evaluate(() => {
    const el = document.querySelector('[data-project]')!;
    return el.scrollWidth > el.clientWidth;
  });
  expect(overflow).toBe(false);
});
