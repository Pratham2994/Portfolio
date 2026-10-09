import { expect, test } from '@playwright/test';

import { open } from './helpers';

test('a language pulls a thread to each poster built with it', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-threads] button', { hasText: 'C++' }).click();
  await expect(page.locator('[data-thread-count]')).toHaveAttribute('data-thread-count', '1');
  await expect(page.locator('[data-poster="prats-deck"]')).toHaveAttribute('data-threaded', '');
  await expect(page.locator('[data-wall]')).toHaveAttribute('data-threading', '');
  // Escape lets go of the thread.
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-thread-count]')).toHaveAttribute('data-thread-count', '0');
  await expect(page.locator('[data-threaded]')).toHaveCount(0);
});

test('opening a project puts its sticker in the album', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('[data-album-button]')).toHaveText('album 0/10');
  await open(page, '/work/scrub');
  await open(page, '/');
  await expect(page.locator('[data-album-button]')).toHaveText('album 1/10');
  await page.locator('[data-album-button]').click();
  await expect(page.locator('#album-page li[data-stuck]')).toHaveCount(1);
  await expect(page.locator('#album-page li[data-stuck]')).toContainText('Scrub');
});

test('the career reads as a transfer history', async ({ page }) => {
  await open(page, '/');
  const rows = page.locator('#you ol > li');
  await expect(rows.nth(0)).toHaveAttribute('data-move', 'signed');
  await expect(rows.nth(0)).toContainText('Fee: one pre-placement offer');
  await expect(rows.nth(1)).toHaveAttribute('data-move', 'loan');
  await expect(rows.nth(3)).toHaveAttribute('data-move', 'academy');
});

test('the calendar note shows today, and an older page when it is pulled', async ({ page }) => {
  await open(page, '/');
  const note = page.locator('[data-piece="now"]');
  await expect(note).toContainText('Local models');
  await note.click();
  await expect(note).toContainText('September', { timeout: 4000 });
  await expect(note).toContainText('Scrub');
});

test('the numbers on a project page end on their real values', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  const shown = () =>
    page.locator('[data-flap]').evaluateAll((flaps) => flaps.map((flap) => [...flap.querySelectorAll('[aria-hidden]')].map((n) => n.textContent).join('')));
  await expect.poll(shown, { timeout: 6000 }).toEqual(['5', '10/12', '300']);
  // A paper under review is shown the way a match shows a decision that has not come.
  await expect(page.locator('[data-var]').first()).toContainText('Paper under review');
});
