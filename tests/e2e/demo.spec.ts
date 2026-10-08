import { expect, test } from '@playwright/test';

import { open } from './helpers';

const slugs = ['scrub', 'neat', 'prats-deck', 'omnicompiler', 'floatchat', 'idea-hackathon', 'chronicle', 'algomotion', 'malshield', 'local-llm-lab'];

// Playwright needs the first argument to be a destructuring pattern.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
  test.skip(!['laptop', 'phone'].includes(info.project.name), 'two sizes are enough for these checks');
});

test('every project page has its own working part, with no overflow', async ({ page }) => {
  for (const slug of slugs) {
    await open(page, `/work/${slug}`);
    const demo = page.locator(`[data-demo="${slug}"]`);
    await expect(demo).toHaveCount(1);
    await demo.scrollIntoViewIfNeeded();
    const overflow = await page.locator('[data-project]').evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow, slug).toBe(false);
  }
});

test('Scrub works out the bitrate from the size limit and the clip length', async ({ page }) => {
  await open(page, '/work/scrub');
  const result = page.locator('[data-demo="scrub"] [data-result] b');
  // 10 MB over 60 seconds: 10 * 8192 / 60 = 1365 kbps, less 128 for sound.
  await expect(result).toHaveText('1,237');
  await page.getByRole('button', { name: /Email/ }).click();
  await expect(result).toHaveText('3,285');
});

test('OmniCompiler keeps the debugger state when the language changes', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  const demo = page.locator('[data-demo="omnicompiler"]');
  await demo.getByRole('button', { name: 'Step' }).click();
  const before = await demo.locator('[data-watch]').innerText();
  await demo.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(demo.locator('ol li').first()).toHaveText('total := 0');
  expect(await demo.locator('[data-watch]').innerText()).toBe(before);
});

test('Algomotion really sorts', async ({ page }) => {
  await open(page, '/work/algomotion');
  const demo = page.locator('[data-demo="algomotion"]');
  await demo.getByRole('button', { name: 'Sort' }).click();
  await expect(demo.getByRole('button', { name: 'Sort' })).toBeEnabled({ timeout: 15000 });
  const heights = await demo.locator('[class*="sortBars"] i').evaluateAll((bars) => bars.map((bar) => parseFloat((bar as HTMLElement).style.height)));
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  await expect(demo.locator('[data-count] b')).toHaveText('91');
});

test('the lab ranks the same models differently by the two numbers', async ({ page }) => {
  await open(page, '/work/local-llm-lab');
  const demo = page.locator('[data-demo="local-llm-lab"]');
  await expect(demo.locator('ol li').first()).toContainText('Gemma 4 26B');
  await demo.getByRole('button', { name: /per hour/ }).click();
  await expect(demo.locator('ol li').first()).toContainText('Gemma 4 12B coder');
});

test('MalShield plays one scan to a verdict', async ({ page }) => {
  await open(page, '/work/malshield');
  const demo = page.locator('[data-demo="malshield"]');
  await demo.getByRole('button', { name: /Scan a sample/ }).click();
  await expect(demo.locator('[data-verdict]')).toBeVisible({ timeout: 8000 });
});
