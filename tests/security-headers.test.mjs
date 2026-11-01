import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');

test('header values stay compatible with ByteString-only local and edge runtimes', () => {
  assert.equal([...headers].every((character) => character.codePointAt(0) <= 255), true);
});

test('Cloudflare serves baseline transport and browser isolation headers', () => {
  for (const expected of [
    'Strict-Transport-Security: max-age=31536000',
    'X-Frame-Options: DENY',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  ]) {
    assert.match(headers, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('the content security policy preserves required services while closing dangerous defaults', () => {
  const policy = headers.split('\n').find((line) => line.trim().startsWith('Content-Security-Policy:'));
  assert.ok(policy, 'missing Content-Security-Policy');

  assert.equal(policy.includes("'unsafe-inline'"), false);

  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://formspree.io",
    'https://runner.fly.dev',
    'https://gc.zgo.at',
    'https://static.cloudflareinsights.com',
  ]) {
    assert.ok(policy.includes(directive), `missing CSP directive/source: ${directive}`);
  }
});
