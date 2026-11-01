import { expect, test } from '@playwright/test';

test('llms-full exposes only configured public collection entries', async ({ request }) => {
  const response = await request.get('/llms-full.txt');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('text/plain');

  const body = await response.text();
  expect(body).toContain('requests for this file are visible in server analytics');
  expect(body).toContain('<!-- source: /src/content/projects/codecanvas.md -->');
  expect(body).not.toContain('https://u64.cam-visible');
  expect(body).not.toContain('/src/content/projects/remux.md');
  expect(body).not.toContain('/src/content/projects/stack-overflow-client.md');
  expect(body).not.toContain('/src/content/notes/orbit-on-nixos-unofficial.md');
});
