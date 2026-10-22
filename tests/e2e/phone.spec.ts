import { expect, test } from '@playwright/test';

import { open } from './helpers';

// Secrets on a phone: there is nothing to type, so they are picked from the list, with a tap.
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the phone only');
  await open(page, '/');
});

test('a secret picked from the list plays on a phone, and leaves the wall clean', async ({ page }) => {
  await page.locator('[data-cheat]').tap();
  await page.locator('#secret-list').getByRole('button', { name: 'kamehameha', exact: true }).tap();
  // The list gets out of the way, and the moment plays.
  await expect(page.locator('#secret-list')).toHaveCount(0);
  await expect(page.locator('.sport')).toHaveCount(1);
  await expect(page.locator('.sport')).toHaveCount(0, { timeout: 12000 });
  const left = await page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('[data-poster], [data-piece], [data-centre], [data-wall]')].filter(
        (el) => el.style.transform || el.style.opacity || el.style.filter,
      ).length,
  );
  expect(left).toBe(0);
});

test('petting the cat five times opens the list', async ({ page }) => {
  const cat = page.locator('[data-cat]');
  for (let i = 0; i < 5; i++) {
    await cat.dispatchEvent('pointerdown');
    await page.waitForTimeout(80);
  }
  await expect(page.locator('#secret-list')).toBeVisible();
});

test('a tap on the way back works when the phone sends no click', async ({ page }) => {
  // A tap while the page still glides from a swipe only stops it: the phone sends the press and
  // the release, but no click. The way back must answer to the tap by itself.
  await page.locator('[data-poster="chronicle"]').first().tap();
  await expect(page).toHaveURL(/\/work\/chronicle/);
  const close = page.locator('[data-close]');
  await expect(close).toBeVisible();
  const box = (await close.boundingBox())!;
  const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
  await close.dispatchEvent('pointerdown', at);
  await close.dispatchEvent('pointerup', at);
  await expect(page).toHaveURL(/\/$/);
});
