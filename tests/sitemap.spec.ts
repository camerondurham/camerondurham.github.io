import { expect, test } from '@playwright/test';

test('sitemap advertises public content and keeps the OAuth callback out', async ({ request }) => {
  const response = await request.get('/sitemap-0.xml');
  expect(response.ok()).toBeTruthy();
  const body = await response.text();

  expect(body).toContain('<loc>https://u64.cam/agents-only/sitemap-canary/</loc>');
  expect(body).toContain('<loc>https://u64.cam/guestbook/</loc>');
  expect(body).not.toContain('/whoop/callback/');
});
