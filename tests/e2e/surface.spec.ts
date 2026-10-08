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
