import { expect, test } from '@playwright/test';

test('every poster carries one piece of art with a real size', async ({ page }) => {
  await page.goto('/');
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll('[data-poster]')].map((poster) => {
      const art = poster.querySelectorAll('[data-art]');
      const box = art[0]?.getBoundingClientRect();
      return { count: art.length, ok: !!box && box.width > 40 && box.height > 40 };
    }),
  );
  expect(sizes).toHaveLength(10);
  expect(sizes.every((s) => s.count === 1 && s.ok)).toBe(true);
});

test('poster art is hidden from assistive technology', async ({ page }) => {
  await page.goto('/');
  const exposed = await page.locator('[data-art]:not([aria-hidden="true"])').count();
  expect(exposed).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no art animation runs on the wall', async ({ page }) => {
    await page.goto('/');
    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect).target?.closest('[data-wall]'))
          .length,
    );
    expect(running).toBe(0);
  });
});
