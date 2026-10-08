import { expect, test } from '@playwright/test';

import { open } from './helpers';

const ids = ['sports', 'games', 'anime', 'music', 'pc', 'cube', 'now'];
const tab = (id: string) => `#desk button[aria-controls="desk-${id}"]`;

test('the desk has one button per object, and all card text is in the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#desk button[aria-controls]')).toHaveCount(7);
  for (const id of ids) await expect(page.locator(`#desk-${id}`)).toHaveCount(1);
  await expect(page.locator('#desk-games')).toContainText('Counter-Strike 1.6');
  await expect(page.locator('#desk-pc')).toContainText('RTX 5070');
  await expect(page.locator('#desk-anime li')).toHaveCount(9);
});

test('sport is listed in his order, with his sides', async ({ page }) => {
  await page.goto('/');
  const rows = await page.locator('#desk-sports tbody th').allTextContents();
  expect(rows).toEqual(['Football', 'Cricket', 'Badminton', 'F1', 'Tennis']);
  await expect(page.locator('#desk-sports')).toContainText('Barcelona');
  await expect(page.locator('#desk-sports')).toContainText('Ferrari');
});

test('one card is open at a time', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('#desk-sports')).toBeVisible();
  await page.locator(tab('games')).click();
  await expect(page.locator('#desk-games')).toBeVisible();
  await expect(page.locator('#desk-sports')).toBeHidden();
  await expect(page.locator(tab('games'))).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(tab('sports'))).toHaveAttribute('aria-expanded', 'false');
});

test('every desk button works from the keyboard', async ({ page }) => {
  await open(page, '/');
  for (const id of ids) {
    await page.locator(tab(id)).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(`#desk-${id}`)).toBeVisible();
  }
});

test('an object in the drawing opens its card', async ({ page }) => {
  await open(page, '/');
  await page.locator('#desk').scrollIntoViewIfNeeded();
  await page.locator('#desk [data-object="pc"]').click();
  await expect(page.locator('#desk-pc')).toBeVisible();
  await expect(page.locator('#desk [data-object="pc"]')).toHaveAttribute('data-active', 'true');
});

test('the clock shows the time in Pune', async ({ page }) => {
  await open(page, '/');
  const expected = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const shown = await page.locator('#desk [data-time]').textContent();
  const minutes = (text: string) => Number(text.slice(0, 2)) * 60 + Number(text.slice(3, 5));
  // The test and the page may read the clock a minute apart.
  expect(Math.abs(minutes(shown!) - minutes(expected)) % 1439).toBeLessThanOrEqual(1);
});

test('the room light switch changes the room', async ({ page }) => {
  await open(page, '/');
  const desk = page.locator('#desk');
  await expect(desk).toHaveAttribute('data-room', 'white');
  const before = await desk.evaluate((el) => getComputedStyle(el).getPropertyValue('--lamp'));
  await page.locator('#desk [data-switch]').click();
  await expect(desk).toHaveAttribute('data-room', 'purple');
  await expect(page.locator('#desk [data-switch]')).toHaveAttribute('aria-pressed', 'true');
  expect(await desk.evaluate((el) => getComputedStyle(el).getPropertyValue('--lamp'))).not.toBe(before);
});

test('the stopwatch stops on his best time', async ({ page }) => {
  await open(page, '/');
  await page.locator(tab('cube')).click();
  await expect(page.locator('#desk [data-watch]')).toContainText('45.00', { timeout: 6000 });
});

test('the desk does not overflow', async ({ page }) => {
  await open(page, '/');
  await page.locator('#desk').scrollIntoViewIfNeeded();
  for (const id of ids) {
    await page.locator(tab(id)).click();
    const bad = await page.evaluate(
      () =>
        [...document.querySelectorAll('#desk *')].filter((el) => {
          const box = el.getBoundingClientRect();
          return box.width > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
        }).length,
    );
    expect(bad, id).toBe(0);
  }
});
