import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { prepareLocalRuntime } from './guestbook-local-runtime.mjs';
import { onRequest } from '../functions/api/guestbook.js';

const state = await mkdtemp(join('/tmp', 'u64-d1-'));
const env = { ...process.env, GUESTBOOK_STATE_DIR: state, WRANGLER_LOG_PATH: resolve('.wrangler/logs'), WRANGLER_SEND_METRICS: 'false' };
const base = 'http://127.0.0.1:8094';
const cli = process.env.WRANGLER_BIN || resolve('node_modules/.bin/wrangler');
const runtimeDirectory = resolve(`.wrangler/guestbook-test-${process.pid}`);
let server;
let browser;
function run(...args) {
  const result = spawnSync(process.execPath, ['scripts/guestbook-wrangler.mjs', ...args], { env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
function sql(command) {
  const output = run('sql', '--command', command, '--json');
  return JSON.parse(output.slice(output.indexOf('[')))[0].results;
}
const count = () => sql('SELECT count(*) AS n FROM guestbook_submissions')[0].n;
const post = (body, headers = {}) => fetch(`${base}/api/guestbook`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', ...headers }, body });
async function start() {
  const runtime = prepareLocalRuntime(runtimeDirectory);
  server = spawn(cli, ['pages', 'dev', '--cwd', runtime, '--local', '--ip', '127.0.0.1', '--port', '8094', '--inspector-port', '0', '--persist-to', state], { env, cwd: runtime, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', chunk => { log += chunk; });
  server.stderr.on('data', chunk => { log += chunk; });
  for (let i = 0; i < 200; i++) {
    if (server.exitCode !== null) throw new Error(log);
    try { if ((await fetch(`${base}/api/guestbook`)).status === 405) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server timeout: ${log}`);
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const child = server;
  await new Promise(resolve => { child.once('exit', resolve); process.kill(-child.pid, 'SIGTERM'); });
  server = undefined;
}
try {
  // Do not attach to or kill an existing service on this port.
  const net = await import('node:net');
  await new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(8094, '127.0.0.1', () => probe.close(resolve)); });
  run('migrate');
  await start();
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
    assert.equal((await fetch(`${base}/api/guestbook`, { method })).status, 405, method);
  }
  const bad = [
    '', 'name=x', 'name=+&note=x', 'name=x&note=+',
    `name=${'x'.repeat(81)}&note=x`, `name=x&note=${'x'.repeat(2001)}`,
    `name=x&note=x&model=${'x'.repeat(81)}`, `name=x&note=x&referrer=${'x'.repeat(201)}`,
    'name=x&note=x&name=y', 'name=x&note=x&extra=y', 'name=x&note=%ZZ', 'name=x&note=%FF', 'name=x&note=%00',
  ];
  for (const body of bad) assert.equal((await post(body)).status, 400, body.slice(0, 100));
  for (const body of ['{', '[]', '{"name":12,"note":"x"}', '{"name":"x","note":"x","note":"y"}', '{"name":"x","note":"x","extra":"y"}', '{"name":"x","note":null}', '{"name":"x","note":"x","na\\u006de":"y"}']) {
    assert.equal((await post(body, { 'Content-Type': 'application/json' })).status, 400, body);
  }
  assert.equal((await post('name=x&note=x', { 'Content-Type': 'text/plain' })).status, 415);
  for (const headers of [{ Origin: 'https://evil.test' }, { Origin: 'null' }, { 'Sec-Fetch-Site': 'cross-site' }, { 'Sec-Fetch-Site': 'same-site' }]) {
    const response = await post('name=x&note=x', headers);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  assert.equal((await post('x'.repeat(33000))).status, 413);
  async function* chunks() { for (let i = 0; i < 40; i++) yield 'x'.repeat(1000); }
  const oversized = await fetch(`${base}/api/guestbook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: chunks(), duplex: 'half' });
  assert.equal(oversized.status, 413, 'chunked oversized body');
  assert.equal((await post('name=bot&note=spam&_gotcha=filled')).status, 200);
  assert.equal(count(), 0, 'invalid/honeypot must never insert');

  sql(`WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM n WHERE x < 150) INSERT INTO guestbook_rate_limits (key, window_start, count, expires_at) SELECT 'expired-' || x, 0, 1, 0 FROM n`);
  const privateNote = `PRIVATE-${Date.now()} <script>alert('x')</script> & plain text`.padEnd(2000, 'x');
  const response = await post(JSON.stringify({ name: "Agent '); DROP TABLE guestbook_submissions;--".padEnd(80, "x"), note: privateNote, model: 'm'.repeat(80), referrer: 'r'.repeat(200) }), { 'Content-Type': 'application/json' });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  let rows = sql('SELECT * FROM guestbook_submissions');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].note, privateNote);
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[0].name.length, 80);
  assert.equal(rows[0].model, 'm'.repeat(80));
  assert.equal(rows[0].referrer, 'r'.repeat(200));
  assert.equal(sql('SELECT count(*) AS n FROM guestbook_rate_limits WHERE expires_at = 0')[0].n, 50, 'cleanup bounded to 100 rows');
  assert.equal(Object.keys(rows[0]).some(key => /ip/i.test(key)), false);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.goto(`${base}/guestbook/`);
  assert.equal(await page.locator('[data-guestbook-form]').getAttribute('action'), '/api/guestbook');
  assert.equal((await page.locator('main').textContent()).includes('Formspree'), false);
  await page.getByLabel(/Name/).fill('Browser visitor');
  await page.getByLabel(/^Note/).fill('Browser persists to D1');
  await page.getByRole('button', { name: 'Send note' }).click();
  await page.getByRole('status').filter({ hasText: 'Received for review.' }).waitFor();
  assert.equal(await page.getByLabel(/^Note/).inputValue(), '');
  assert.equal(sql("SELECT count(*) AS n FROM guestbook_submissions WHERE note = 'Browser persists to D1'")[0].n, 1);
  const native = await browser.newContext({ javaScriptEnabled: false });
  const nativePage = await native.newPage();
  await nativePage.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await nativePage.goto(`${base}/guestbook/`);
  await nativePage.getByLabel(/Name/).fill('NoJS');
  await nativePage.getByLabel(/^Note/).fill('<script>x</script>');
  const [receipt] = await Promise.all([nativePage.waitForNavigation(), nativePage.getByRole('button', { name: 'Send note' }).click()]);
  assert.equal(receipt.status(), 201);
  const html = await nativePage.content();
  await native.close();
  assert.ok(html.includes('Received for review.'));
  assert.ok(!html.includes('<script>'));
  for (const path of ['/guestbook/', '/guestbook.json', '/']) assert.ok(!(await (await fetch(base + path)).text()).includes(privateNote.slice(0, 20)), path);

  // The quota must survive a runtime restart and resist concurrent admission.
  await stop(); await start();
  const results = await Promise.all(Array.from({ length: 8 }, (_, i) => post(`name=Concurrent${i}&note=hello`, { 'CF-Connecting-IP': `192.0.2.${i}` })));
  assert.equal(results.filter(r => r.status === 201).length, 2);
  assert.equal(results.filter(r => r.status === 429).length, 6);
  assert.equal(count(), 5);
  rows = sql('SELECT * FROM guestbook_rate_limits');
  assert.deepEqual(rows.map(row => [row.key, row.count]), [['local-shared', 5]]);
  await page.getByLabel(/Name/).fill('Limited'); await page.getByLabel(/^Note/).fill('Keep my draft');
  await page.getByRole('button', { name: 'Send note' }).click();
  await page.getByRole('status').filter({ hasText: 'We couldn’t confirm receipt.' }).waitFor();
  assert.equal(await page.getByLabel(/^Note/).inputValue(), 'Keep my draft');

  // Failure paths cannot be activated through the public local config.
  for (const config of [{}, { PUBLIC_GUESTBOOK_BACKEND: 'd1' }, { PUBLIC_GUESTBOOK_BACKEND: 'd1', DB: { prepare() { throw new Error('must not insert'); } } }]) {
    const failed = await onRequest({ request: new Request(`${base}/api/guestbook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":"x","note":"x"}' }), env: config });
    assert.equal(failed.status, 503);
    assert.ok(!(await failed.text()).includes('must not insert'));
  }
  sql('DROP TABLE guestbook_rate_limits');
  assert.equal((await post('name=SchemaMissing&note=must fail closed')).status, 503);
  assert.equal(count(), 5);
  console.log('PASS: actual local D1 persistence/readback, browser success/failure, static receipt, validation, chunked limit, origins/methods, honeypot, private feed, restart + atomic concurrent quota, fail closed.');
} finally {
  await browser?.close();
  await stop();
  await rm(runtimeDirectory, { recursive: true, force: true });
  await rm(state, { recursive: true, force: true });
}
