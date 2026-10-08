import { expect, type Page } from '@playwright/test';

/** Loads a path and waits until the app is interactive. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('html[data-ready]')).toHaveCount(1);
}
