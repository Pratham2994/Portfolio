import { expect, test, type Page } from '@playwright/test';

import { open } from './helpers';

const paths = ['/', '/work/scrub', '/work/idea-hackathon'];
// Every page, for the check at each width.
const all = [
  '/',
  ...['scrub', 'neat', 'prats-deck', 'omnicompiler', 'floatchat', 'idea-hackathon', 'malshield', 'local-llm-lab', 'chronicle', 'algomotion'].map((slug) => `/work/${slug}`),
];
// The edges of the layout, then real screens: small and large phones, 13 to 15.6 inch laptops, and 24 and 27 inch monitors.
const edges = [320, 599, 600, 899, 900, 1279, 1280, 360, 390, 412, 430, 1366, 1440, 1536, 1920, 2560];

async function check(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-project]') ?? document.documentElement;
    const scroller = document.querySelector('[data-project]') ?? document.querySelector('main')!;
    // Poster art and the curl at a poster's corner are clipped by the poster, so they are not part of the layout check.
    const past = [...scroller.querySelectorAll<HTMLElement>('*')].filter((el) => {
      if (el.closest('[data-art], [data-curl], [data-cat], [data-light]')) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
    });
    const small = [...scroller.querySelectorAll<HTMLElement>('p, li, dd, dt, a, button')].filter((el) => {
      if (el.closest('[data-art], [data-poster], [data-piece], [data-centre], [aria-hidden="true"]')) return false;
      return el.innerText.trim() && parseFloat(getComputedStyle(el).fontSize) < 12;
    });
    return {
      overflow: root.scrollWidth > root.clientWidth,
      past: past.slice(0, 3).map((el) => el.tagName + '.' + el.className),
      small: small.slice(0, 3).map((el) => el.innerText.slice(0, 30)),
    };
  });
  expect(result).toEqual({ overflow: false, past: [], small: [] });
}

for (const path of paths) {
  test(`${path} holds its layout`, async ({ page }) => {
    await open(page, path);
    await check(page);
  });
}

for (const path of all) {
  test(`${path} holds its layout at every width, from a small phone to a 27 inch monitor`, async ({ page }, info) => {
    test.skip(info.project.name !== 'laptop', 'widths are set by the test itself');
    test.setTimeout(120_000);
    for (const width of edges) {
      await page.setViewportSize({ width, height: width < 900 ? 800 : Math.round(width * 0.5625) });
      await open(page, path);
      await check(page);
    }
  });
}

test('body text in the written sections is at least 14px', async ({ page }) => {
  await open(page, '/');
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#desk [role="region"] p, #you p')].map((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    ),
  );
  expect(sizes.length).toBeGreaterThan(5);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);
  expect(sizes.filter((size) => size >= 14).length).toBeGreaterThan(sizes.length / 2);
});
