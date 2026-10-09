import { expect, test, type Page } from '@playwright/test';

import { open } from './helpers';

const wide = ['laptop-short', 'laptop', 'desktop', 'wide'];

// Nothing a secret set on the wall may stay on it.
const leftovers = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>('[data-poster], [data-piece], [data-centre], [data-wall]')].filter(
        (el) => el.style.transform || el.style.translate || el.style.rotate || el.style.scale || el.style.opacity || el.style.filter,
      ).length,
  );

test.beforeEach(async ({ page }, info) => {
  test.skip(!wide.includes(info.project.name), 'the wide wall only');
  await open(page, '/');
});

test('typing "lights out" runs a race start and times the reaction', async ({ page }) => {
  await page.keyboard.type('lights out', { delay: 20 });
  // The space in the phrase does not page the wall away.
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await expect(page.locator('[data-race]')).toHaveCount(1);
  await expect(page.locator('.race-pod[data-on]')).toHaveCount(5, { timeout: 8000 });
  await expect(page.locator('.race-pod[data-on]')).toHaveCount(0, { timeout: 5000 });
  await page.keyboard.press('Space');
  await expect(page.locator('.race-time')).toHaveText(/^\d\.\d{3}s$/);
  await expect(page.locator('[data-race]')).toHaveCount(0, { timeout: 10000 });
  expect(await leftovers(page)).toBe(0);
  await expect(page.locator('[data-cheat]')).toContainText('1/11');
  // A poster still opens afterwards.
  await page.locator('[data-poster="scrub"]').click();
  await expect(page.locator('#project-title')).toHaveText('Scrub');
});

test('going before the lights are out is a jump start', async ({ page }) => {
  await page.keyboard.type('lightsout', { delay: 20 });
  await expect(page.locator('.race-pod[data-on]')).toHaveCount(2, { timeout: 8000 });
  await page.keyboard.press('Space');
  await expect(page.locator('.race-time')).toHaveText('Jump start');
  await expect(page.locator('[data-race]')).toHaveCount(0, { timeout: 10000 });
  expect(await leftovers(page)).toBe(0);
});

for (const word of ['messi', 'kohli', 'federer', 'rcb', 'siuu', 'smash', 'ace', 'box box', 'naruto']) {
  test(`typing "${word}" plays its moment and leaves the wall clean`, async ({ page }) => {
    await page.keyboard.type(word, { delay: 20 });
    await expect(page.locator('.sport')).toHaveCount(1);
    await expect(page.locator('.sport')).toHaveCount(0, { timeout: 12000 });
    expect(await leftovers(page)).toBe(0);
  });
}

test('the list names every secret, and a click on one starts it', async ({ page }) => {
  await page.locator('[data-cheat]').click();
  await expect(page.locator('#secret-list li')).toHaveCount(11);
  await page.getByRole('button', { name: 'kohli' }).click();
  await expect(page.locator('.sport[data-sport="kohli"]')).toHaveCount(1);
  await expect(page.locator('[data-cheat]')).toContainText('1/11');
});

test('"meow" moves the hint on to the next secret', async ({ page }) => {
  await expect(page.locator('[data-hint]')).toContainText('meow');
  await page.keyboard.type('meow', { delay: 20 });
  await expect(page.locator('[data-hint]')).toContainText('lights out');
});

test('a click on the cat is a pet', async ({ page }) => {
  const box = (await page.locator('[data-cat]').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-puff="heart"]')).toHaveCount(1);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the words do nothing', async ({ page }) => {
    await page.keyboard.type('lightsout', { delay: 20 });
    await page.waitForTimeout(400);
    await expect(page.locator('[data-race]')).toHaveCount(0);
  });
});
