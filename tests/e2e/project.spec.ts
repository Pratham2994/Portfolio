import { expect, test } from '@playwright/test';

import { open } from './helpers';

test('poster opens its project and Escape returns to the wall', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page.locator('#project-title')).toHaveText('Scrub');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-project]')).toHaveCount(0);
});

test('the project page is fetched while the wall is up, so the first poster does not wait for it', async ({ page }) => {
  await open(page, '/');
  // Its code and its styles are asked for ahead of any click.
  await expect(page.locator('head link[rel="modulepreload"][href*="/work-"]')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('head link[rel="prefetch"][as="style"]')).not.toHaveCount(0);
});

test('where a project runs live, its status at the top is the link to it', async ({ page }) => {
  await open(page, '/work/sandglass');
  const live = page.locator('[data-status-live]:visible');
  await expect(live).toHaveAttribute('href', 'https://sandglass.prathampanchal02994.workers.dev/');
  await expect(live).toContainText('Live in the browser');
  // A project with no live address keeps a plain status.
  await open(page, '/work/neat');
  await expect(page.locator('[data-status-live]')).toHaveCount(0);
});

test('direct load shows the page, and close leads home', async ({ page }) => {
  await open(page, '/work/neat');
  await expect(page.locator('#project-title')).toHaveText('Neat');
  await expect(page).toHaveTitle('Neat - Pratham Panchal');
  await page.locator('[data-close]').click();
  await expect(page).toHaveURL(/\/$/);
});

test('next and previous walk the wall in order and wrap', async ({ page }) => {
  await open(page, '/work/neat');
  await page.locator('[data-next]').click();
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await page.locator('[data-prev]').click();
  await expect(page).toHaveURL(/\/work\/neat$/);
});

test('the next project waits at the end of the page, and the arrow keys turn the pages', async ({ page }) => {
  await open(page, '/work/neat');
  await expect(page.locator('[data-next]')).toContainText('Scrub');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/work\/scrub$/);
  await expect(page.locator('#project-title')).toHaveText('Scrub');
  // The sheet that covered the turn is gone once the new page is in.
  await expect(page.locator('[data-ghost]')).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\/work\/neat$/);
});

test('a project with a stage shows it, and the sectors in the bar fill as the page goes by', async ({ page }) => {
  for (const slug of ['scrub', 'neat', 'prats-deck', 'omnicompiler', 'floatchat', 'idea-hackathon', 'malshield', 'local-llm-lab', 'chronicle', 'sandglass']) {
    await open(page, `/work/${slug}`);
    await expect(page.locator(`[data-stage="${slug}"]`)).toBeVisible();
    await expect(page.locator('#project-title')).toBeVisible();
  }
  const project = page.locator('[data-project]');
  await expect(project).toHaveAttribute('data-sector', '0');
  await project.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(project).toHaveAttribute('data-sector', '3');
});

test('a team project says what was mine', async ({ page }) => {
  await open(page, '/work/floatchat');
  await expect(page.locator('[data-role]')).toContainText('My part');
  await open(page, '/work/scrub');
  await expect(page.locator('[data-role]')).toHaveCount(0);
});

test('unknown slug shows the not-found page with a way home', async ({ page }) => {
  await open(page, '/work/nope');
  await expect(page.getByRole('heading', { name: /not on the wall/i })).toBeVisible();
  await page.getByRole('link', { name: /back to the wall/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('keyboard: Enter on a poster opens it and focus lands on the title', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="scrub"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#project-title')).toBeFocused();
});

test('closing returns focus to the poster, and the wall is inert while a page is open', async ({ page }) => {
  await open(page, '/');
  await page.locator('[data-poster="neat"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-poster="neat"]')).toBeFocused();
});

test('a project page has no horizontal overflow', async ({ page }) => {
  await open(page, '/work/omnicompiler');
  await expect(page.locator('#project-title')).toBeVisible();
  const overflow = await page.evaluate(() => {
    const el = document.querySelector('[data-project]')!;
    return el.scrollWidth > el.clientWidth;
  });
  expect(overflow).toBe(false);
});
