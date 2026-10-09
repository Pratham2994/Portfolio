import { expect, test } from '@playwright/test';

import { open } from './helpers';

const fine = (name: string) => !['phone', 'tablet'].includes(name);
const viewX = () => Number(getComputedStyle(document.querySelector('[data-wall]')!).getPropertyValue('--view-x'));

test('the wall is a textured surface, not a gradient', async ({ page }) => {
  await open(page, '/');
  const image = await page.locator('[data-wall]').evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(image).toContain('textures/wall');
  expect(image).not.toContain('gradient');
});

test('the light layer mounts only where it should', async ({ page }, info) => {
  await open(page, '/');
  const wanted = await page.evaluate(
    () =>
      !!document.createElement('canvas').getContext('webgl2') &&
      window.innerWidth >= 900 &&
      navigator.hardwareConcurrency >= 4 &&
      window.matchMedia('(orientation: landscape)').matches,
  );
  await expect(page.locator('[data-light]')).toHaveCount(wanted ? 1 : 0);
  if (info.project.name === 'phone') expect(wanted).toBe(false);
});

test('the pointer shifts the view only with a fine pointer', async ({ page }, info) => {
  await open(page, '/');
  expect(await page.evaluate(viewX)).toBe(0);
  await page.mouse.move(40, 40);
  await page.mouse.move(60, 60);
  if (fine(info.project.name) && info.project.name !== 'portrait') {
    await expect.poll(() => page.evaluate(viewX)).not.toBe(0);
  } else {
    await page.waitForTimeout(300);
    expect(await page.evaluate(viewX)).toBe(0);
    const transform = await page.locator('[data-wall] > div').evaluate((el) => getComputedStyle(el).transform);
    expect(transform).toBe('none');
  }
});

test('scrolling away tips the wall back, with a mouse on a wide screen', async ({ page }, info) => {
  await open(page, '/');
  const scroll = () => page.evaluate(() => Number(getComputedStyle(document.querySelector('main')!).getPropertyValue('--scroll') || 0));
  expect(await scroll()).toBe(0);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6));
  if (fine(info.project.name)) {
    await expect.poll(scroll).toBeGreaterThan(0.2);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(scroll).toBe(0);
  } else {
    await page.waitForTimeout(300);
    expect(await scroll()).toBe(0);
  }
});

test('the wall dims at once under the pointer and stays dim across the gaps', async ({ page }, info) => {
  test.skip(!['laptop-short', 'laptop', 'desktop', 'wide'].includes(info.project.name), 'needs a mouse on the wide wall');
  await open(page, '/');
  const grid = page.locator('[data-wall] > div');
  const box = async (slug: string) => (await page.locator(`[data-poster="${slug}"]`).boundingBox())!;
  const neat = await box('neat');
  const deck = await box('prats-deck');
  await page.mouse.move(neat.x + neat.width / 2, neat.y + neat.height / 2);
  await expect(grid).toHaveAttribute('data-dim', '', { timeout: 150 });
  // The gap between two posters: the wall must not light up there.
  await page.mouse.move((neat.x + neat.width + deck.x) / 2, neat.y + neat.height / 2);
  await page.waitForTimeout(120);
  await expect(grid).toHaveAttribute('data-dim', '');
  await page.mouse.move(deck.x + deck.width / 2, deck.y + deck.height / 2);
  await expect(grid).toHaveAttribute('data-dim', '');
  // Off the sheets for good: light again.
  await page.mouse.move(5, 5);
  await expect(grid).not.toHaveAttribute('data-dim', '');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the view does not move', async ({ page }) => {
    await open(page, '/');
    await page.mouse.move(40, 40);
    await page.mouse.move(80, 80);
    await page.waitForTimeout(300);
    expect(await page.evaluate(viewX)).toBe(0);
  });
});
