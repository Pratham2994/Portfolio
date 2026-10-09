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
  await demo.getByRole('button', { name: 'Step over' }).click();
  const before = await demo.locator('[data-watch]').innerText();
  await demo.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(demo.locator('ol li code').nth(2)).toHaveText('total := 0');
  await expect(demo.locator('[data-native]')).toHaveText('Delve');
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

test('Neat clears its queue group by group, and a rule files the next one by itself', async ({ page }) => {
  await open(page, '/work/neat');
  const demo = page.locator('[data-demo="neat"]');
  const count = demo.locator('[data-result] b');
  await expect(count).toHaveText('9');
  await demo.getByRole('button', { name: /sure ones/ }).click();
  await expect(count).toHaveText('3');
  await demo.getByRole('checkbox').check();
  await demo.getByRole('button', { name: /Move to Finance/ }).click();
  await expect(count).toHaveText('0');
  await demo.getByRole('button', { name: /one more invoice/ }).click();
  await expect(demo.locator('[data-learned] p')).toContainText('Filed 1 by itself');
  // Undo brings a group back.
  await demo.locator('[data-group="installers"]').getByRole('button', { name: 'Undo' }).click();
  await expect(count).toHaveText('3');
});

test('the deck opens an app from its home page and goes back', async ({ page }) => {
  await open(page, '/work/prats-deck');
  const demo = page.locator('[data-demo="prats-deck"]');
  const screen = demo.locator('[data-screen]');
  await expect(screen).toHaveAttribute('data-screen', 'home');
  await expect(demo.getByRole('button', { name: /^Open / })).toHaveCount(15);
  await demo.getByRole('button', { name: 'Open Chindi' }).click();
  await demo.getByRole('button', { name: /Play a song/ }).click();
  await expect(screen).toHaveAttribute('data-screen', 'chindi-dancing');
  await expect(screen.locator('img')).toHaveJSProperty('complete', true);
  expect(await screen.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(640);
  await demo.getByRole('button', { name: 'Back to the home page' }).click();
  await expect(screen).toHaveAttribute('data-screen', 'home');
  // Every app has its own picture.
  for (const [name, picture] of [['Galaxy', 'galaxy'], ['Wi-Fi', 'wifi'], ['Settings', 'settings']]) {
    await demo.getByRole('button', { name: `Open ${name}` }).click();
    await expect(screen).toHaveAttribute('data-screen', picture);
    await expect(demo.locator('h3')).toHaveText(name);
    await expect.poll(() => screen.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(640);
    await demo.getByRole('button', { name: 'Back to the home page' }).click();
  }
});

test('OmniCompiler runs to a breakpoint, with the same controls in every language', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  const demo = page.locator('[data-demo="omnicompiler"]');
  await demo.getByRole('button', { name: 'Breakpoint on line 6' }).click();
  await demo.getByRole('button', { name: 'Continue' }).click();
  await expect(demo.locator('ol li[data-here] code')).toHaveText('print(total)');
  await expect(demo.locator('[data-watch]')).toContainText('29');
  await demo.getByRole('button', { name: 'Java', exact: true }).click();
  await expect(demo.locator('[data-native]')).toHaveText('jdb');
  await expect(demo.locator('[data-watch]')).toContainText('29');
});

test('OmniCompiler steps into the function and out of it, and the call stack follows', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  const demo = page.locator('[data-demo="omnicompiler"]');
  // It starts on line 5, the call. A step in goes to the function.
  await demo.getByRole('button', { name: 'Step in' }).click();
  await expect(demo.locator('[data-stack] li')).toHaveText(['area, line 2', 'main, line 5']);
  await expect(demo.locator('[data-watch]')).toContainText('w');
  await demo.getByRole('button', { name: 'Step out' }).click();
  await expect(demo.locator('[data-stack] li')).toHaveCount(1);
  await expect(demo.locator('[data-watch]')).toContainText('4');
});

test('FloatChat shows the tool the model calls, and a different picture for each question', async ({ page }) => {
  await open(page, '/work/floatchat');
  const demo = page.locator('[data-demo="floatchat"]');
  await expect(demo.locator('[data-tool] b')).toHaveText('timeseries_line');
  await demo.getByRole('button', { name: /saltiest/ }).click();
  await expect(demo.locator('[data-tool] b')).toHaveText('heatmap_grid');
  await expect(demo.locator('[data-picture="heatmap_grid"] rect')).toHaveCount(50, { timeout: 8000 });
  await demo.getByRole('button', { name: /floats near India/ }).click();
  await expect(demo.locator('[data-picture="map_points"] circle')).toHaveCount(26, { timeout: 8000 });
  // A question that is not about the ocean stops at the gate: no tool, no picture.
  await demo.getByRole('button', { name: /pizza/ }).click();
  await expect(demo.locator('[data-answer][data-refused]')).toContainText('irrelevant or off-topic');
  await expect(demo.locator('[data-stamp]')).toHaveText('Refused');
  await expect(demo.locator('[data-tool]')).toHaveCount(0);
  await expect(demo.locator('[data-stages] li[data-state="done"]')).toHaveCount(1);
});

test('the way back stays in view when a project page is scrolled', async ({ page }) => {
  await open(page, '/work/scrub');
  const project = page.locator('[data-project]');
  await project.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(page.locator('[data-close]')).toBeInViewport();
  await page.locator('[data-close]').click();
  await expect(project).toHaveCount(0);
});

test('a run lights its stages one after the other, to the end', async ({ page }) => {
  await open(page, '/work/scrub');
  const demo = page.locator('[data-demo="scrub"]');
  await expect(demo.locator('[data-command]')).toContainText('-b:v 1237k');
  await demo.getByRole('button', { name: 'Run it' }).click();
  await expect(demo.locator('[data-stages][data-over]')).toHaveCount(0);
  await expect(demo.locator('[data-stages][data-over]')).toHaveCount(1, { timeout: 8000 });
  await expect(demo.locator('[data-stages] li[data-state="done"]')).toHaveCount(6);
  await expect(demo.locator('[data-stamp]')).toHaveText('Fits');
});

test('each of the first five projects has a picture of what runs underneath', async ({ page }) => {
  for (const slug of ['scrub', 'neat', 'prats-deck', 'omnicompiler', 'floatchat']) {
    await open(page, `/work/${slug}`);
    const flow = page.locator('[data-flow]');
    await expect(flow.locator('svg:visible')).toHaveCount(1);
    expect(await flow.locator('svg:visible g[data-kind]').count()).toBeGreaterThanOrEqual(8);
  }
});
