import { expect, test } from '@playwright/test';

import { open } from './helpers';

// The projects that still have a demo under the drawing. The other three are driven on their stage.
const slugs = ['scrub', 'neat', 'floatchat', 'idea-hackathon', 'chronicle', 'malshield'];

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
  // The flyer at the foot of the wall has email strips too, so the button is looked for in the demo only.
  await page.locator('[data-demo="scrub"]').getByRole('button', { name: /Email/ }).click();
  await expect(result).toHaveText('3,285');
});

test('the Sandglass box takes what you draw, and Rewind takes it back', async ({ page }) => {
  await open(page, '/work/sandglass');
  const stage = page.locator('[data-stage="sandglass"]');
  const canvas = stage.locator('canvas').first();
  // Lava-coloured cells in the picture.
  const lava = () =>
    canvas.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 150 && d[i + 2] < 90) n++;
      return n;
    });
  await stage.getByRole('button', { name: 'Lava' }).click();
  await expect(stage.getByRole('button', { name: 'Lava' })).toHaveAttribute('aria-pressed', 'true');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect.poll(lava).toBeGreaterThan(5);
  // Held, Rewind goes back to before the lava was drawn.
  const hold = (await stage.locator('[data-rewind]').boundingBox())!;
  await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
  await page.mouse.down();
  await expect(stage.locator('[data-rewinding]')).toHaveCount(1);
  await expect.poll(lava, { timeout: 8000 }).toBe(0);
  await page.mouse.up();
  await expect(stage.locator('[data-rewinding]')).toHaveCount(0);
});

test('Chronicle reads the same plays on three clocks', async ({ page }) => {
  await open(page, '/work/chronicle');
  const demo = page.locator('[data-demo="chronicle"]');
  await demo.getByRole('button', { name: 'Mumbai' }).click();
  // The real peak of my own history, once the clock is right.
  await expect(demo.locator('[data-stamp]')).toHaveText('5 pm', { timeout: 8000 });
  await expect(demo.locator('[data-report]')).toContainText('These hours are true');
  await demo.getByRole('button', { name: 'UTC' }).click();
  await expect(demo.locator('[data-report]')).toContainText('Wrong by 5.5 hours', { timeout: 8000 });
});

test('MalShield plays one scan to a verdict', async ({ page }) => {
  await open(page, '/work/malshield');
  const demo = page.locator('[data-demo="malshield"]');
  await expect(demo.locator('[data-stamp]')).toHaveText('Do not open');
  await demo.getByRole('button', { name: 'notes.zip' }).click();
  await expect(demo.locator('[data-stamp]')).toHaveText('Clean', { timeout: 8000 });
  await expect(demo.locator('[data-verdict]')).toBeVisible();
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

test('every project has a small drawing of what runs underneath, with one sentence', async ({ page }) => {
  for (const slug of [...slugs, 'prats-deck', 'omnicompiler', 'local-llm-lab', 'sandglass']) {
    await open(page, `/work/${slug}`);
    const sketch = page.locator(`[data-sketch="${slug}"]`);
    await expect(sketch.locator('svg')).toBeVisible();
    expect(await sketch.locator('g[data-part]').count()).toBeGreaterThanOrEqual(2);
    await expect(sketch.locator('figcaption')).not.toBeEmpty();
  }
});

test('the OmniCompiler stage is a debugger you can drive: a language, and the same buttons', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  const stage = page.locator('[data-stage="omnicompiler"]');
  await stage.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(stage.locator('[data-native]')).toContainText('Delve');
  // From the first line, a step in goes one frame on, and a continue runs to the end.
  await stage.getByRole('button', { name: 'Continue' }).click();
  await stage.getByRole('button', { name: 'Continue' }).click();
  await stage.getByRole('button', { name: 'Step in' }).click();
  await expect(stage.locator('[data-seen]')).toContainText('total');
  await stage.getByRole('button', { name: 'C++' }).click();
  await expect(stage.locator('[data-native]')).toContainText('gdb');
  await stage.getByRole('button', { name: 'Step in' }).click();
  await expect(stage.locator('[data-native]')).toContainText('-exec-step');
});

test('the lab stage ranks the same models differently by the two numbers', async ({ page }) => {
  await open(page, '/work/local-llm-lab');
  const stage = page.locator('[data-stage="local-llm-lab"]');
  await stage.getByRole('button', { name: 'Tasks passed' }).click();
  await expect(stage.locator('[data-board] li[data-place="1"]')).toContainText('Gemma 4 26B');
  await stage.getByRole('button', { name: 'Right answers per hour' }).click();
  await expect(stage.locator('[data-board] li[data-place="1"]')).toContainText('Gemma 4 12B coder');
  await expect(stage.locator('[data-board] li[data-place="4"]')).toContainText('Gemma 4 26B');
});

test('the deck stage opens an app from its home page and goes back', async ({ page }) => {
  await open(page, '/work/prats-deck');
  const stage = page.locator('[data-stage="prats-deck"]');
  await stage.getByRole('button', { name: 'Open Snake' }).click();
  await expect(stage.locator('[data-on-screen]')).toContainText('Snake');
  await expect(stage.locator('[data-screen]')).toHaveAttribute('data-screen', 'snake');
  await stage.getByRole('button', { name: 'Back to the home page' }).click();
  await expect(stage.locator('[data-screen]')).toHaveAttribute('data-screen', 'home');
});

test('iDEA sorts three set messages, each to its own department, and takes no typing', async ({ page }) => {
  await open(page, '/work/idea-hackathon');
  const demo = page.locator('[data-demo="idea-hackathon"]');
  await expect(demo.locator('[data-stamp]')).toHaveText('Grievance');
  await demo.getByRole('button', { name: 'Typed' }).click();
  await expect(demo.locator('[data-said]')).toContainText('password');
  await expect(demo.locator('[data-stamp]')).toHaveText('Operations');
  await demo.getByRole('button', { name: 'Voice' }).click();
  await expect(demo.locator('[data-stamp]')).toHaveText('Loans');
  await expect(demo.locator('textarea, input')).toHaveCount(0);
});
