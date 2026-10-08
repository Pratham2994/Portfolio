import { expect, test } from '@playwright/test';

test('wall shows every project and the centre piece', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  await expect(page.locator('[data-centre]')).toContainText('ALMOST');
});

test('no two pieces on the wide wall share a cell, and no corner is left empty', async ({ page }, info) => {
  test.skip(['phone', 'tablet', 'portrait'].includes(info.project.name), 'the wide wall only');
  await page.goto('/');
  const wall = await page.evaluate(() => {
    const grid = document.querySelector('[data-wall] > div')!.getBoundingClientRect();
    const boxes = [...document.querySelectorAll('[data-poster]')].map((el) => el.getBoundingClientRect());
    const corner = (x: number, y: number) =>
      boxes.some((b) => Math.abs((b.left + b.right) / 2 - x) < grid.width * 0.2 && Math.abs((b.top + b.bottom) / 2 - y) < grid.height * 0.25);
    const overlap = boxes.some((a, i) =>
      boxes.some((b, j) => i < j && a.left < b.right - 8 && b.left < a.right - 8 && a.top < b.bottom - 8 && b.top < a.bottom - 8),
    );
    return {
      overlap,
      corners: [corner(grid.left, grid.top), corner(grid.right, grid.top), corner(grid.left, grid.bottom), corner(grid.right, grid.bottom)],
    };
  });
  expect(wall).toEqual({ overlap: false, corners: [true, true, true, true] });
});

test('pieces on the wide wall differ in size and place', async ({ page }, info) => {
  test.skip(['phone', 'tablet', 'portrait'].includes(info.project.name), 'the wide wall only');
  await page.goto('/');
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll('[data-poster][data-size="poster"]')].map((el) => Math.round(el.getBoundingClientRect().height)),
  );
  expect(new Set(sizes).size).toBeGreaterThan(2);
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
