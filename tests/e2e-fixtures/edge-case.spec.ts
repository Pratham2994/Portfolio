import { expect, test } from '@playwright/test';

test('a project with a long title and no optional fields holds its layout', async ({ page }) => {
  await page.goto('/work/edge-case');
  await expect(page.locator('#project-title')).toHaveText('A project with a very long title indeed');
  const overflow = await page.evaluate(() => {
    const el = document.querySelector('[data-project]')!;
    return el.scrollWidth > el.clientWidth;
  });
  expect(overflow).toBe(false);
});

test('sections without content are not rendered', async ({ page }) => {
  await page.goto('/work/edge-case');
  const emptyHeadings = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-project] h2')].filter((h) => !h.nextElementSibling?.textContent?.trim())
        .length,
  );
  expect(emptyHeadings).toBe(0);
  await expect(page.locator('[data-project] [data-live]')).toHaveCount(0);
  await expect(page.locator('[data-project] [data-role]')).toHaveCount(0);
  await expect(page.locator('[data-project] [data-media]')).toHaveCount(0);
});

test('the long title fits its poster on the wall', async ({ page }) => {
  await page.goto('/');
  const poster = page.locator('[data-poster="edge-case"]');
  await expect(poster).toBeVisible();
  const clipped = await poster.evaluate((el) => {
    const title = el.querySelector('strong')!.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return title.left < box.left - 1 || title.right > box.right + 1 || title.top < box.top - 1;
  });
  expect(clipped).toBe(false);
});
