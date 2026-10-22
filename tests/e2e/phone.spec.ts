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
