import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from '../functions/api/guestbook.js';
import { onRequest as middleware } from '../functions/_middleware.js';

const local = { PUBLIC_GUESTBOOK_BACKEND: 'd1', GUESTBOOK_IP_MODE: 'local-shared', GUESTBOOK_RUNTIME: 'local' };
const trusted = { PUBLIC_GUESTBOOK_BACKEND: 'd1', GUESTBOOK_IP_MODE: 'trusted-cf', GUESTBOOK_IP_SALT: 'synthetic-test-only-private-salt-123456' };
function request({ url = 'http://127.0.0.1:9876/api/guestbook', body = 'name=Synthetic&note=hello', headers = {}, cf = true, ...options } = {}) {
  const value = new Request(url, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers }, ...options });
  if (cf) Object.defineProperty(value, 'cf', { value: { colo: 'TEST' } });
  return value;
}
function database() {
  const calls = [];
  return { calls, prepare(sql) { return { bind(...values) { calls.push({ sql, values }); return { run: async () => ({ success: true }), first: async () => ({ count: 1 }) }; } }; } };
}

test('runtime opt-in, binding, local boundary, trusted metadata/header and salt fail closed', async () => {
  for (const [env, options] of [
    [{}, {}], [{ ...local, PUBLIC_GUESTBOOK_BACKEND: '' }, {}],
    [{ ...local, GUESTBOOK_RUNTIME: undefined }, {}],
    [local, { url: 'https://u64.cam/api/guestbook' }],
    [{ ...local, GUESTBOOK_LOCAL_ORIGIN: 'https://u64.cam' }, { url: 'https://u64.cam/api/guestbook' }],
    [{ ...local, GUESTBOOK_LOCAL_ORIGIN: 'https://preview.example.ts.net:11443' }, { url: 'https://another.example.ts.net:11443/api/guestbook' }],
    [local, { url: 'http://public.example/api/guestbook' }],
    [{ ...trusted, GUESTBOOK_IP_SALT: '' }, {}],
    [{ ...trusted, GUESTBOOK_IP_SALT: ' '.repeat(40) }, {}],
    [{ ...trusted, GUESTBOOK_IP_SALT: 'short' }, {}],
    [trusted, {}], [trusted, { cf: false, headers: { 'CF-Connecting-IP': '192.0.2.1' } }],
    ...['127.1', '999.0.0.1', '01.2.3.4', '1.2.3.4:80', ':::', '::ffff:192.0.2.1', '::1%zone', 'bad-header'].map(ip => [trusted, { headers: { 'CF-Connecting-IP': ip } }]),
  ]) {
    const db = database();
    const response = await onRequest({ request: request(options), env: { DB: db, ...env } });
    assert.equal(response.status, 503, JSON.stringify(options));
    assert.deepEqual(db.calls, [], 'misconfiguration must not reach D1');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal((await onRequest({ request: request(), env: local })).status, 503);
});

test('local shared mode permits only its explicitly configured private preview origin', async () => {
  const origin = 'https://preview.example.ts.net:11443';
  const db = database();
  const value = request({ url: `${origin}/api/guestbook`, headers: { Origin: origin } });
  assert.equal((await onRequest({ request: value, env: { ...local, GUESTBOOK_LOCAL_ORIGIN: origin, DB: db } })).status, 201);
  assert.equal(db.calls.find(call => call.sql.includes('ON CONFLICT')).values[0], 'local-shared');
});

test('the local TLS proxy allowance requires exact private host/port and the HTTPS marker', async () => {
  const origin = 'https://preview.example.ts.net:11443';
  const env = { ...local, GUESTBOOK_LOCAL_ORIGIN: origin, DB: database() };
  for (const [url, headers, status] of [
    ['http://preview.example.ts.net:11443/api/guestbook', { 'X-Forwarded-Proto': 'https' }, 201],
    ['http://preview.example.ts.net:11443/api/guestbook', {}, 503],
    ['http://preview.example.ts.net:11443/api/guestbook', { 'X-Forwarded-Proto': 'http' }, 503],
    ['http://preview.example.ts.net:11444/api/guestbook', { 'X-Forwarded-Proto': 'https' }, 503],
    ['http://another.example.ts.net:11443/api/guestbook', { 'X-Forwarded-Proto': 'https' }, 503],
    ['http://u64.cam/api/guestbook', { 'X-Forwarded-Proto': 'https' }, 503],
  ]) assert.equal((await onRequest({ request: request({ url, headers: { Origin: new URL(url).origin, ...headers } }), env })).status, status, url);
  assert.equal((await onRequest({ request: request({ url: 'http://preview.example.ts.net:11443/api/guestbook', headers: { 'X-Forwarded-Proto': 'https' } }), env: { ...env, GUESTBOOK_RUNTIME: undefined } })).status, 503);
});

test('HMAC identifiers normalize IPv6 and rotate by window and salt without persisting raw IPs', async t => {
  let now = 1_800_000_000_000;
  t.mock.method(Date, 'now', () => now);
  async function key(ip, salt = trusted.GUESTBOOK_IP_SALT) {
    const db = database();
    assert.equal((await onRequest({ request: request({ headers: { 'CF-Connecting-IP': ip } }), env: { ...trusted, GUESTBOOK_IP_SALT: salt, DB: db } })).status, 201);
    assert.equal(JSON.stringify(db.calls).includes(ip), false);
    return db.calls.find(call => call.sql.includes('ON CONFLICT')).values[0];
  }
  const first = await key('2001:db8::1');
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, await key('2001:0db8:0000:0000:0000:0000:0000:0001'));
  assert.notEqual(first, await key('2001:db8::2'));
  assert.notEqual(first, await key('2001:db8::1', `${trusted.GUESTBOOK_IP_SALT}-rotated`));
  now += 600_000;
  assert.notEqual(first, await key('2001:db8::1'));
});

test('stream deadline and byte cap apply before parsing, with cancellation', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } });
  const response = await onRequest({ request: request({ body: stream, duplex: 'half' }), env: { ...local, DB: database() } });
  assert.equal(response.status, 408);
  assert.equal(cancelled, true);
  const db = database();
  const tooBig = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(32769)); } });
  assert.equal((await onRequest({ request: request({ body: tooBig, duplex: 'half' }), env: { ...local, DB: db } })).status, 413);
  assert.deepEqual(db.calls, []);
});

test('bad UTF-8, lone surrogates, non-string values and encoded duplicate keys are rejected', async () => {
  for (const body of [new Uint8Array([0xff]), '{"name":"x","note":"\\ud800"}', '{"name":"x","note":true}', '{"name":"x","note":"x","na\\u006de":"y"}']) {
    assert.equal((await onRequest({ request: request({ body, headers: { 'Content-Type': 'application/json' } }), env: { ...local, DB: database() } })).status, 400);
  }
  const db = database();
  assert.equal((await onRequest({ request: request({ body: 'name=Visitor&note=%F0%9F%91%8B+hello' }), env: { ...local, DB: db } })).status, 201);
  assert.equal(db.calls.at(-1).values[1], '👋 hello');
});

test('database failures are generic, private, and excluded from request analytics', async () => {
  let analytics = 0;
  const value = request({ body: 'name=Synthetic&note=PRIVATE-BODY', headers: { Accept: 'text/html' } });
  const response = await middleware({
    request: value,
    env: { SCRAPER_ANALYTICS: { writeDataPoint() { analytics++; } } },
    next: () => onRequest({ request: value, env: { ...local, DB: { prepare() { throw new Error('PRIVATE-SQL-ERROR'); } } } }),
  });
  assert.equal(response.status, 503);
  assert.equal(analytics, 0);
  const html = await response.text();
  assert.ok(html.includes('Back button'));
  assert.doesNotMatch(html, /PRIVATE|<script/i);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('permissions-policy'), /camera=\(\)/);
});

test('database TypeError, SyntaxError and URIError remain generic infrastructure failures', async () => {
  for (const Failure of [TypeError, SyntaxError, URIError]) {
    const response = await onRequest({ request: request(), env: { ...local, DB: { prepare() { throw new Failure('PRIVATE-INFRASTRUCTURE'); } } } });
    assert.equal(response.status, 503, Failure.name);
    assert.doesNotMatch(await response.text(), /PRIVATE-INFRASTRUCTURE/);
  }
});

test('crypto TypeError remains a generic infrastructure failure', async t => {
  const db = database();
  t.mock.method(crypto.subtle, 'importKey', async () => { throw new TypeError('PRIVATE-CRYPTO'); });
  const response = await onRequest({ request: request({ headers: { 'CF-Connecting-IP': '192.0.2.1' } }), env: { ...trusted, DB: db } });
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /PRIVATE-CRYPTO/);
  assert.deepEqual(db.calls, []);
});
