import { expect, test } from '@playwright/test';

import { open } from './helpers';

const ids = ['sports', 'games', 'anime', 'music', 'now', 'cube'];

test('the desk has one button per object, and all panel text is in the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#desk button[aria-controls]')).toHaveCount(6);
  for (const id of ids) await expect(page.locator(`#desk-${id}`)).toHaveCount(1);
  await expect(page.locator('#desk-games')).toContainText('Counter-Strike 1.6');
});

test('sport is listed in his order', async ({ page }) => {
  await page.goto('/');
  const text = (await page.locator('#desk-sports').textContent()) ?? '';
  const order = ['Football', 'cricket', 'badminton', 'F1', 'tennis'].map((word) => text.indexOf(word));
  expect(order.every((at) => at >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test('one panel is open at a time', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('#desk-sports')).toBeVisible();
  await page.locator('#desk button[aria-controls="desk-games"]').click();
  await expect(page.locator('#desk-games')).toBeVisible();
  await expect(page.locator('#desk-sports')).toBeHidden();
  await expect(page.locator('#desk button[aria-controls="desk-games"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#desk button[aria-controls="desk-sports"]')).toHaveAttribute('aria-expanded', 'false');
});

test('every desk button works from the keyboard', async ({ page }) => {
  await open(page, '/');
  for (const id of ids) {
    const button = page.locator(`#desk button[aria-controls="desk-${id}"]`);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(`#desk-${id}`)).toBeVisible();
  }
});

test('the desk does not overflow', async ({ page }) => {
  await open(page, '/');
  await page.locator('#desk').scrollIntoViewIfNeeded();
  const bad = await page.evaluate(
    () =>
      [...document.querySelectorAll('#desk *')].filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
      }).length,
  );
  expect(bad).toBe(0);
});
