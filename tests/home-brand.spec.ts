import { test, expect } from '@playwright/test';

test('homepage uses cam branding with an accessible primary heading', async ({ page }) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav').getByRole('link', { name: 'cam', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'cam' })).toHaveCount(1);
    await expect(page.locator('main')).not.toContainText('Cameron Durham');
    await expect(page.getByRole('heading', { level: 2, name: 'Recent' })).toBeVisible();
    await expect(page).toHaveTitle('Cameron Durham');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
});
