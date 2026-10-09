import { expect, test } from '@playwright/test';

import { open } from './helpers';

test('wall shows every project and the centre piece', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('[data-poster]')).toHaveCount(10);
  await expect(page.locator('[data-centre]')).toContainText('ALMOST');
});

const wideOnly = ['phone', 'tablet', 'portrait'];

test('the wide wall is hung in paper sizes: one A3, nine A4, three A5', async ({ page }, info) => {
  test.skip(wideOnly.includes(info.project.name), 'the wide wall only');
  await open(page, '/');
  const papers = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-wall] [data-paper]')].map((cell) => {
      const sheet = cell.firstElementChild!.getBoundingClientRect();
      return { paper: cell.dataset.paper!.slice(0, 2), area: sheet.width * sheet.height, id: (cell.firstElementChild as HTMLElement).dataset.poster };
    }),
  );
  const count = (paper: string) => papers.filter((p) => p.paper === paper).length;
  expect([count('a3'), count('a4'), count('a5')]).toEqual([1, 9, 3]);
  expect(papers.find((p) => p.paper === 'a3')!.id).toBe('scrub');
  // Real paper sizes: each step doubles the area.
  const area = (paper: string) => papers.find((p) => p.paper === paper)!.area;
  expect(area('a3') / area('a4')).toBeCloseTo(2, 0);
  expect(area('a4') / area('a5')).toBeGreaterThan(1.7);
});

test('no two sheets overlap, and every corner of the wall has one', async ({ page }, info) => {
  test.skip(wideOnly.includes(info.project.name), 'the wide wall only');
  await open(page, '/');
  const wall = await page.evaluate(() => {
    const sheets = [...document.querySelectorAll('[data-poster], [data-piece]')];
    const boxes = sheets.map((el) => el.getBoundingClientRect());
    // One piece hangs outside the block on purpose, so the block is measured without it.
    const block = sheets.filter((el) => !el.closest('[data-outside]')).map((el) => el.getBoundingClientRect());
    const left = Math.min(...block.map((b) => b.left));
    const right = Math.max(...block.map((b) => b.right));
    const top = Math.min(...boxes.map((b) => b.top));
    const bottom = Math.max(...boxes.map((b) => b.bottom));
    const near = (x: number, y: number) =>
      boxes.some((b) => Math.abs((b.left + b.right) / 2 - x) < (right - left) * 0.2 && Math.abs((b.top + b.bottom) / 2 - y) < (bottom - top) * 0.25);
    const overlap = boxes.some((a, i) =>
      boxes.some((b, j) => i < j && a.left < b.right - 6 && b.left < a.right - 6 && a.top < b.bottom - 6 && b.top < a.bottom - 6),
    );
    return { overlap, corners: [near(left, top), near(right, top), near(left, bottom), near(right, bottom)] };
  });
  expect(wall).toEqual({ overlap: false, corners: [true, true, true, true] });
});

test('the personal pieces lead to the sections below', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('[data-piece="pass"]')).toHaveAttribute('href', '#you');
  await expect(page.locator('[data-piece="ticket"]')).toHaveAttribute('href', '#desk');
  await expect(page.locator('[data-piece="pass"]')).toContainText('BOM');
  await expect(page.locator('[data-piece="pass"]')).toContainText('PNQ');
});

test('no poster is clipped or overflowing', async ({ page }) => {
  await open(page, '/');
  const bad = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-poster]')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < 0 || r.right > innerWidth + 1 || r.width < 90;
      }).length,
  );
  expect(bad).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('200% zoom keeps the wall usable', async ({ page }) => {
  await open(page, '/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('the wall reports its column count', async ({ page }, info) => {
  await open(page, '/');
  const expected = { phone: '2', tablet: '3', portrait: '3' }[info.project.name] ?? '5';
  await expect(page.locator('[data-wall]')).toHaveAttribute('data-columns', expected);
});

test('on a 13 inch laptop no poster art runs into its text', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'sets its own window sizes');
  for (const [width, height] of [
    [1280, 715],
    [1440, 790],
    [1366, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await open(page, '/');
    const clashes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-poster]')]
        .filter((poster) => {
          // The drawn part of the art, and the first line of text under it.
          const art = poster.querySelector('[data-art] > *')!.getBoundingClientRect();
          const title = poster.querySelector('strong')!.getBoundingClientRect();
          // Waves and the big word are drawn behind the text on purpose.
          if (poster.querySelector('[data-art] svg') || art.height > poster.getBoundingClientRect().height * 0.75) return false;
          return art.bottom > title.top + 2;
        })
        .map((poster) => poster.dataset.poster),
    );
    expect(clashes, `${width}x${height}`).toEqual([]);
    // The whole wall fits in the window: nothing is cut off at the bottom.
    const lowest = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-poster], [data-piece]')].map((el) => el.getBoundingClientRect().bottom)));
    expect(lowest, `${width}x${height}`).toBeLessThanOrEqual(height);
  }
});
