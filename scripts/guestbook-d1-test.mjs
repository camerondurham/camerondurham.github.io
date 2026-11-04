import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { prepareLocalRuntime } from './guestbook-local-runtime.mjs';
import { onRequest } from '../functions/api/guestbook.js';

const state = await mkdtemp(join('/tmp', 'u64-d1-'));
const env = { ...process.env, GUESTBOOK_STATE_DIR: state, WRANGLER_LOG_PATH: resolve('.wrangler/logs'), WRANGLER_SEND_METRICS: 'false' };
const probe = createServer();
await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
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
async function start(overrides = {}) {
  const runtime = prepareLocalRuntime(runtimeDirectory);
  const configPath = join(runtime, 'wrangler.jsonc');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  Object.assign(config.vars, overrides);
  await writeFile(configPath, JSON.stringify(config));
  server = spawn(cli, ['pages', 'dev', '--cwd', runtime, '--local', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', '0', '--persist-to', state], { env, cwd: runtime, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
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
  for (const contentType of ['text/plain', 'multipart/form-data; boundary=abc', 'application/json; charset=iso-8859-1', 'application/json; extra=1']) assert.equal((await post('name=x&note=x', { 'Content-Type': contentType })).status, 415);
  assert.equal((await post('name=x&note=x', { 'Content-Encoding': 'gzip' })).status, 415);
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
  const violations = [];
  page.on('pageerror', error => violations.push(String(error)));
  page.on('console', message => { if (message.type() === 'error' && /Content Security Policy|Refused to|violat/i.test(message.text())) violations.push(message.text()); });
  await page.goto(`${base}/guestbook/`);
  assert.match((await fetch(`${base}/guestbook/`)).headers.get('content-security-policy'), /form-action 'self'/);
  assert.equal((await (await fetch(`${base}/guestbook-action.json`)).json()).target.urlTemplate, 'https://u64.cam/api/guestbook');
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
  sql("UPDATE guestbook_submissions SET status = 'published' WHERE id = 1");
  for (const path of ['/guestbook/', '/guestbook.json', '/', '/api/guestbook?status=pending', '/api/guestbook/inbox']) assert.ok(!(await (await fetch(base + path)).text()).includes(privateNote.slice(0, 20)), path);

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

  // A native failed POST must not echo submitted text; Back recovers the form.
  const failedNative = await browser.newContext({ javaScriptEnabled: false });
  const failedPage = await failedNative.newPage();
  await failedPage.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await failedPage.goto(`${base}/guestbook/`);
  await failedPage.getByLabel(/Name/).fill('Recover native draft');
  await failedPage.getByLabel(/^Note/).fill('Native failure draft');
  const [failedReceipt] = await Promise.all([failedPage.waitForNavigation(), failedPage.getByRole('button', { name: 'Send note' }).click()]);
  assert.equal(failedReceipt.status(), 429);
  assert.ok(!(await failedPage.content()).includes('Native failure draft'));
  await failedPage.goBack();
  assert.equal(await failedPage.getByLabel(/^Note/).inputValue(), 'Native failure draft');
  await failedNative.close();
  assert.deepEqual(violations, [], 'D1 form works under the current strict CSP');

  // Failure paths cannot be activated through the public local config.
  for (const config of [{}, { PUBLIC_GUESTBOOK_BACKEND: 'd1' }, { PUBLIC_GUESTBOOK_BACKEND: 'd1', DB: { prepare() { throw new Error('must not insert'); } } }]) {
    const failed = await onRequest({ request: new Request(`${base}/api/guestbook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"name":"x","note":"x"}' }), env: config });
    assert.equal(failed.status, 503);
    assert.ok(!(await failed.text()).includes('must not insert'));
  }
  // Production mode uses real local D1 but synthetic trusted-CF headers.
  sql('DELETE FROM guestbook_rate_limits');
  await stop();
  await start({ GUESTBOOK_IP_MODE: 'trusted-cf', GUESTBOOK_IP_SALT: 'synthetic-test-salt-32-characters-long' });
  const trusted = await Promise.all(Array.from({ length: 9 }, () => post('name=Trusted&note=Synthetic', { 'CF-Connecting-IP': '192.0.2.90' })));
  assert.equal(trusted.filter(r => r.status === 201).length, 5);
  assert.equal(trusted.filter(r => r.status === 429).length, 4);
  assert.equal((await post('name=Other&note=Synthetic', { 'CF-Connecting-IP': '192.0.2.91' })).status, 201);
  // Receipt loss/retry is intentionally not deduplicated; document this contract.
  assert.equal((await post('name=Other&note=Synthetic', { 'CF-Connecting-IP': '192.0.2.91' })).status, 201);
  assert.equal(sql("SELECT count(*) AS n FROM guestbook_submissions WHERE name = 'Other'")[0].n, 2);
  assert.equal((await post('name=Other&note=Synthetic', { 'CF-Connecting-IP': 'not-an-ip' })).status, 503);
  const keys = sql('SELECT key FROM guestbook_rate_limits').map(row => row.key);
  assert.equal(keys.length, 2);
  assert.ok(keys.every(key => /^[a-f0-9]{64}$/.test(key)));
  await stop(); await start({ GUESTBOOK_IP_MODE: 'trusted-cf', GUESTBOOK_IP_SALT: 'short' });
  const beforeFailure = count();
  assert.equal((await post('name=NoSalt&note=must fail closed', { 'CF-Connecting-IP': '192.0.2.90' })).status, 503);
  assert.equal(count(), beforeFailure);
  await stop(); await start({ PUBLIC_GUESTBOOK_BACKEND: '' });
  await page.reload();
  await page.getByLabel(/Name/).fill('Disabled runtime');
  await page.getByLabel(/^Note/).fill('Keep disabled draft');
  await page.getByRole('button', { name: 'Send note' }).click();
  await page.getByRole('status').filter({ hasText: 'We couldn’t confirm receipt.' }).waitFor();
  assert.equal(await page.getByLabel(/^Note/).inputValue(), 'Keep disabled draft');
  assert.equal(count(), beforeFailure);
  await stop(); await start();
  sql('DROP TABLE guestbook_rate_limits');
  assert.equal((await post('name=SchemaMissing&note=must fail closed')).status, 503);
  assert.equal(count(), beforeFailure);
  console.log(`PASS (local port ${port}): D1 readback/pending status, JS/no-JS receipt + draft recovery, strict CSP, validation/encoding/stream cap, methods/origins/honeypot, private feed despite status change, persistence/restart + atomic shared and trusted-CF quotas, hashed identifiers, retries, salt/runtime/schema fail closed.`);
} finally {
  await browser?.close();
  await stop();
  await rm(runtimeDirectory, { recursive: true, force: true });
  await rm(state, { recursive: true, force: true });
}
