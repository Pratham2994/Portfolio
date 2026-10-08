import { expect, test } from '@playwright/test';

test('home renders with the name and no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Pratham Panchal/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
