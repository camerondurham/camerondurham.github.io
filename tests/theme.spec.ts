import { test, expect } from '@playwright/test';

const light = 'rgb(250, 250, 250)';
const dark = 'rgb(26, 26, 26)';

for (const system of ['light', 'dark'] as const) {
  test(`theme toggle overrides ${system} system preference and persists`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: system });
    const page = await context.newPage();
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
    await expect(html).toHaveCSS('background-color', system === 'dark' ? dark : light);
    await toggle.click();
    await expect(html).toHaveCSS('background-color', system === 'dark' ? light : dark);
    await page.reload();
    await expect(html).toHaveCSS('background-color', system === 'dark' ? light : dark);
    await toggle.click();
    await expect(html).toHaveCSS('background-color', system === 'dark' ? dark : light);
    await context.close();
  });
}

test('dark system preference works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('background-color', dark);
  await context.close();
});

test('theme works when storage is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('background-color', dark);
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect(page.locator('html')).toHaveCSS('background-color', light);
  await expect(page.locator('#theme-icon')).toHaveText('☾');
  await context.close();
});
