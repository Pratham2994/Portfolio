import { expect, test } from '@playwright/test';

test('wall shows every project, the centre and empty frames', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  await expect(page.locator('[data-centre]')).toContainText('ALMOST');
  expect(await page.locator('[data-empty]').count()).toBeGreaterThan(0);
});

test('no poster is clipped or overflowing', async ({ page }) => {
  await page.goto('/');
  const bad = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-poster]')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < 0 || r.right > innerWidth + 1 || r.width < 120;
      }).length,
  );
  expect(bad).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('200% zoom keeps the wall usable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('the wall reports its column count', async ({ page }, info) => {
  await page.goto('/');
  const expected = { phone: '2', tablet: '3', portrait: '3' }[info.project.name] ?? '5';
  await expect(page.locator('[data-wall]')).toHaveAttribute('data-columns', expected);
});
