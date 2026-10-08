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

const running = (slug?: string) => (page: import('@playwright/test').Page) =>
  page.evaluate(
    (only) =>
      document
        .getAnimations()
        // Keyframe animations only: hover transitions on the poster itself do not count.
        .filter((a) => a instanceof CSSAnimation && a.playState === 'running')
        .map((a) => (a.effect as KeyframeEffect).target?.closest<HTMLElement>('[data-art]')?.closest<HTMLElement>('[data-poster]')?.dataset.poster)
        .filter((id) => id && (!only || id === only)).length,
    slug,
  );

test('with a mouse the art holds still, and plays on the poster under the pointer', async ({ page }, info) => {
  test.skip(['phone', 'tablet'].includes(info.project.name), 'touch screens have no hover');
  await page.goto('/');
  await expect(page.locator('[data-wall][data-entered]')).toHaveCount(1, { timeout: 6000 });
  expect(await running()(page)).toBe(0);
  await page.locator('[data-poster="neat"]').hover();
  await expect.poll(() => running('neat')(page)).toBeGreaterThan(0);
  expect(await running('scrub')(page)).toBe(0);
});

test('on a touch screen the art keeps moving', async ({ page }, info) => {
  test.skip(!['phone', 'tablet'].includes(info.project.name), 'touch screens only');
  await page.goto('/');
  expect(await running()(page)).toBeGreaterThan(0);
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
