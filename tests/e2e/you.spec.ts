import { expect, test } from '@playwright/test';

import { open } from './helpers';

test('the timeline lists four places, newest first', async ({ page }) => {
  await page.goto('/');
  const items = page.locator('#you ol > li');
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toContainText('Barclays');
  await expect(items.nth(0)).toContainText('Software Engineer');
  await expect(items.nth(3)).toContainText('K. J. Somaiya');
});

test('the section says where he is from and keeps the grade to one line', async ({ page }) => {
  await page.goto('/');
  const you = page.locator('#you');
  await expect(you).toContainText('Mumbai');
  await expect(you).toContainText('Pune');
  await expect(you).toContainText('Gujarati');
  await expect(you.getByText('9.54')).toHaveCount(1);
});

test('nothing private is on the page', async ({ page }) => {
  await page.goto('/');
  // Poster art is decoration (hex bytes, digits), so only the written sections are read.
  const text = (await page.locator('#desk, #you, #contact').allInnerTexts()).join(' ');
  expect(text).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
  expect(text).not.toMatch(/\b(kg|cm)\b/i);
  expect(text).not.toMatch(/master'?s|MS in|CISO/i);
  expect(text.match(/barclays/gi)).toHaveLength(2);
});

test('the portrait has a text alternative', async ({ page }) => {
  await page.goto('/');
  const alt = await page.locator('#you img').getAttribute('alt');
  expect(alt?.length).toBeGreaterThan(10);
});

test('contact shows the address as text and links out', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact.getByText('prathampanchal02994@gmail.com')).toBeVisible();
  await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Pratham2994');
  await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', /linkedin\.com\/in\//);
  await expect(contact.locator('form')).toHaveCount(0);
});

test('the copy button says when it has copied', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '/');
  // The address is on strips at the bottom of the flyer. Pulling one copies it.
  const strips = page.locator('#contact [data-strip]:not([disabled])');
  const before = await strips.count();
  await strips.first().click();
  await expect(page.locator('#contact [data-said]')).toHaveText('Copied');
  await expect(strips).toHaveCount(before - 1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('prathampanchal02994@gmail.com');
});
