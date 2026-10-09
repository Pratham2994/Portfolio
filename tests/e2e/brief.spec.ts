import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { open } from './helpers';

test('the one-page version has the work, the school and every project', async ({ page }) => {
  await open(page, '/brief');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pratham Panchal');
  await expect(page.getByRole('main')).toContainText('Barclays');
  await expect(page.getByRole('main')).toContainText('K. J. Somaiya College of Engineering');
  await expect(page.locator('main a[href^="/work/"]')).toHaveCount(10);
  // It fits the screen: nothing runs off the side.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('the wall has a way to it, and it has a way back', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-hurry]').click();
  await expect(page).toHaveURL(/\/brief$/);
  await page.getByRole('link', { name: /The full site/ }).click();
  await expect(page.locator('[data-wall]')).toBeVisible();
});

test('the one-page version has no serious accessibility violations', async ({ page }, info) => {
  test.skip(!['laptop', 'phone'].includes(info.project.name), 'two sizes are enough for this check');
  await open(page, '/brief');
  const results = await new AxeBuilder({ page }).include('main').analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
});

test('the resume can be downloaded from the one-page version and from the contact section', async ({ page, request }) => {
  await open(page, '/brief');
  const href = await page.locator('[data-resume]').getAttribute('href');
  expect(href).toMatch(/\.pdf$/);
  const file = await request.get(href!);
  expect(file.status()).toBe(200);
  expect(file.headers()['content-type']).toContain('pdf');
  await open(page, '/');
  await expect(page.locator('#contact [data-resume]')).toHaveAttribute('href', href!);
});
