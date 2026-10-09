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

test('a fast sweep over the wall does not dim it, and a rest on one poster does', async ({ page }, info) => {
  test.skip(!['laptop-short', 'laptop', 'desktop', 'wide'].includes(info.project.name), 'needs a mouse on the wide wall');
  await open(page, '/');
  const grid = page.locator('[data-wall] > div');
  const centreOf = async (slug: string) => {
    const box = (await page.locator(`[data-poster="${slug}"]`).boundingBox())!;
    return [box.x + box.width / 2, box.y + box.height / 2] as const;
  };
  // Sweep: three posters in well under the dwell time.
  for (const slug of ['neat', 'prats-deck', 'omnicompiler']) await page.mouse.move(...(await centreOf(slug)));
  await page.mouse.move(5, 5);
  await page.waitForTimeout(150);
  await expect(grid).not.toHaveAttribute('data-dim', '');
  // Rest on one.
  await page.mouse.move(...(await centreOf('neat')));
  await expect(grid).toHaveAttribute('data-dim', '');
  // Moving to the next poster keeps the wall dim: no flicker.
  await page.mouse.move(...(await centreOf('prats-deck')));
  await page.waitForTimeout(120);
  await expect(grid).toHaveAttribute('data-dim', '');
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
