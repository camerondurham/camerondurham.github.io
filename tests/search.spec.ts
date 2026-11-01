import { expect, test } from '@playwright/test';

test('notes search loads scoped Pagefind data without HTML injection sinks', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/notes/');
  await page.locator('#search-input').fill('coffee');

  const result = page.locator('#search-results a[href="/notes/coffee/"]');
  await expect(result).toBeVisible();
  await expect(result.locator('strong')).toContainText('Coffee');
  expect(pageErrors).toEqual([]);
});
