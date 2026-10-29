import { test, expect } from '@playwright/test';

test('header omits notes while notes and favicon remain available', async ({ page, request }) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav').getByRole('link', { name: '/notes' })).toHaveCount(0);
    await expect(page.locator('nav').getByRole('link', { name: '/work' })).toBeVisible();
  }
  expect((await request.get('/notes/')).status()).toBe(200);
  for (const [selector, type] of [['link[rel="icon"][type="image/svg+xml"]', 'image/svg+xml'], ['link[rel="icon"][href="/favicon.ico"]', 'image/']] as const) {
    const href = await page.locator(selector).getAttribute('href');
    expect(href).toBeTruthy();
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(type);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
});
