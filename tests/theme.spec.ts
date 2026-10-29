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

for (const width of [375, 600, 768, 920, 1280]) {
  test(`header geometry stays stable while toggling at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 800 }, colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const geometry = () => page.evaluate(() => Object.fromEntries(
      ['.nav-container', '.nav-header', '.nav-links', '.nav-socials', '.theme-toggle', 'main'].map((selector) => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return [selector, [rect.x, rect.y, rect.width, rect.height]];
      }),
    ));
    const initial = await geometry();
    const toggle = page.getByRole('button', { name: 'Toggle dark mode' });
    for (let i = 0; i < 3; i++) {
      await toggle.click();
      const current = await geometry();
      for (const selector of Object.keys(initial)) {
        current[selector].forEach((value, index) => expect(Math.abs(value - initial[selector][index])).toBeLessThan(0.1));
      }
    }
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    const reloaded = await geometry();
    for (const selector of Object.keys(initial)) {
      reloaded[selector].forEach((value, index) => expect(Math.abs(value - initial[selector][index])).toBeLessThan(0.1));
    }
    await context.close();
  });
}
