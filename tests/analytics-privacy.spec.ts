import { expect, test } from '@playwright/test';

test('traffic measurement disclosure covers both systems and interpretation limits', async ({ page, request }) => {
  await page.goto('/privacy/analytics/');
  const main = page.locator('main');
  await expect(main).toContainText('Analytics Engine may sample high-volume traffic');
  await expect(main).toContainText('client-controlled and may be spoofed');
  await expect(main).toContainText('quasi-identifying');
  await expect(main).toContainText('Separate GoatCounter measurement');
  await expect(main.getByRole('link', { name: /GoatCounter's privacy documentation/ })).toHaveAttribute(
    'href',
    'https://www.goatcounter.com/help/privacy/',
  );
  await expect(main).toContainText('Raw IP addresses, cookies, URL query strings');

  const hello = await (await request.get('/agents-only/hello.md')).text();
  expect(hello).toContain('reported counts are estimates');
  expect(hello).toMatch(/may be\s+spoofed/);
  expect(hello).toContain('A canary hit proves only');
});
