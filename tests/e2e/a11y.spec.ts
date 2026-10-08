import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { open } from './helpers';

const slugs = [
  'scrub',
  'neat',
  'prats-deck',
  'omnicompiler',
  'floatchat',
  'idea-hackathon',
  'chronicle',
  'algomotion',
  'malshield',
  'local-llm-lab',
];

// Playwright needs the first argument to be a destructuring pattern.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
  test.skip(!['laptop', 'phone'].includes(info.project.name), 'two sizes are enough for these checks');
});

async function violations(page: import('@playwright/test').Page, scope: string) {
  const results = await new AxeBuilder({ page }).include(scope).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes[0].target} ${v.nodes[0].failureSummary?.split('\n')[1]?.trim() ?? ''}`);
}

test('the home page has no serious accessibility violations', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('[data-wall][data-entered]')).toHaveCount(1);
  // Reveal every section first, so text is tested at its resting contrast.
  await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-seen', '')));
  await page.waitForTimeout(700);
  expect(await violations(page, 'main')).toEqual([]);
});

for (const slug of slugs) {
  test(`the ${slug} page has no serious accessibility violations`, async ({ page }) => {
    await open(page, `/work/${slug}`);
    expect(await violations(page, '[data-project]')).toEqual([]);
  });
}

test('Tab reaches every poster, desk button and contact control with a visible focus ring', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop');
  await open(page, '/');
  await expect(page.locator('[data-wall][data-entered]')).toHaveCount(1);
  const seen = new Set<string>();
  const noRing = new Set<string>();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return {
        key: el.dataset.poster ?? el.getAttribute('aria-controls') ?? el.textContent?.trim() ?? '',
        ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      };
    });
    if (!state) continue;
    seen.add(state.key);
    if (!state.ring) noRing.add(state.key);
  }
  for (const slug of slugs) expect(seen).toContain(slug);
  for (const id of ['sports', 'games', 'anime', 'music', 'now', 'cube']) expect(seen).toContain(`desk-${id}`);
  for (const label of ['Copy', 'GitHub', 'LinkedIn']) expect(seen).toContain(label);
  expect([...noRing]).toEqual([]);
});
