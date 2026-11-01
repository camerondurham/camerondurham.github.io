import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  analyticsDataPoint,
  onRequest,
  routeCategory,
} from '../functions/_middleware.js';

function request(url = 'https://u64.cam/guestbook/?code=private-code', method = 'GET') {
  const value = new Request(url, {
    method,
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'en-US,en;q=0.9',
      cookie: 'private=session',
      purpose: 'prefetch',
      referer: 'https://example.com/private/path?token=secret',
      'user-agent': 'ExampleCrawler/1.0',
      'cf-connecting-ip': '192.0.2.1',
    },
  });
  Object.defineProperty(value, 'cf', {
    value: {
      asn: 64500,
      asOrganization: 'Example Network',
      botManagement: { score: 12, verifiedBot: false, signedAgent: true },
      city: 'Private City',
      colo: 'PHX',
      country: 'US',
      httpProtocol: 'HTTP/2',
      latitude: '1.23',
      longitude: '4.56',
      postalCode: '12345',
      tlsVersion: 'TLSv1.3',
    },
  });
  return value;
}

test('analytics data keeps scraper signals and discards sensitive request details', () => {
  const point = analyticsDataPoint(
    request(),
    new Response('ok', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
  );

  assert.deepEqual(point.indexes, ['guestbook-page']);
  assert.deepEqual(point.blobs, [
    '/guestbook/',
    'GET',
    'ExampleCrawler/1.0',
    'https://example.com',
    'US',
    'PHX',
    'Example Network',
    'HTTP/2',
    'TLSv1.3',
    'text/html,application/xhtml+xml',
    'en-US',
    'prefetch',
    'signed-agent',
  ]);
  assert.deepEqual(point.doubles, [200, 64500, 12, 0, 1]);

  const serialized = JSON.stringify(point);
  for (const excluded of [
    'private-code',
    'private=session',
    '/private/path',
    'secret',
    '192.0.2.1',
    'Private City',
    '12345',
    '1.23',
    '4.56',
  ]) {
    assert.equal(serialized.includes(excluded), false, `leaked excluded value: ${excluded}`);
  }
});

test('middleware records GET responses but fails open without a local binding', async () => {
  const written = [];
  const response = new Response('feed', {
    status: 200,
    headers: { 'Content-Type': 'application/feed+json' },
  });
  const context = {
    request: request('https://u64.cam/guestbook.json?ignored=yes'),
    env: { SCRAPER_ANALYTICS: { writeDataPoint: (point) => written.push(point) } },
    next: async () => response,
  };

  assert.equal(await onRequest(context), response);
  assert.equal(written.length, 1);
  assert.deepEqual(written[0].indexes, ['guestbook-feed']);
  assert.equal(written[0].blobs[0], '/guestbook.json');

  await assert.doesNotReject(() => onRequest({
    ...context,
    env: {},
  }));
  await onRequest({
    ...context,
    request: request('https://u64.cam/guestbook/', 'POST'),
  });
  assert.equal(written.length, 1, 'POST requests must not be measured');
});

test('route categories distinguish agent discovery channels and ordinary pages', () => {
  assert.equal(routeCategory('/llms-full.txt', 'text/plain'), 'agent-corpus');
  assert.equal(routeCategory('/agents-only/hello.md', 'text/markdown'), 'agent-page');
  assert.equal(routeCategory('/canary/example/', 'text/html'), 'canary');
  assert.equal(routeCategory('/notes/coffee/', 'text/html'), 'page');
  assert.equal(routeCategory('/unknown', 'application/octet-stream'), 'other');
});

test('Pages routes bypass Functions for generated static assets', async () => {
  const routes = JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.deepEqual(routes.include, ['/*']);
  for (const excluded of ['/_astro/*', '/pagefind/*', '/theme.js', '/guestbook.js']) {
    assert.ok(routes.exclude.includes(excluded));
  }
});
