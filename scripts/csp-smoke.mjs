#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const repoRoot = resolve(import.meta.dirname, '..');

async function availablePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : undefined;
  await new Promise((resolvePromise) => server.close(resolvePromise));
  if (!port) throw new Error('Could not allocate a local port');
  return port;
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

async function waitForServer(url, child, logs) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Wrangler exited before startup:\n${logs.join('')}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Wrangler did not start:\n${logs.join('')}`);
}

const inlineTags = [];
for (const path of await htmlFiles(join(repoRoot, 'dist'))) {
  const html = await readFile(path, 'utf8');
  for (const match of html.matchAll(/<(script|style)\b([^>]*)>/gi)) {
    if (match[1].toLowerCase() === 'style' || !/\bsrc\s*=/.test(match[2])) {
      inlineTags.push(`${path.slice(repoRoot.length + 1)}: ${match[0]}`);
    }
  }
}
assert.deepEqual(inlineTags, [], `strict CSP requires external scripts/styles:\n${inlineTags.join('\n')}`);

const port = await availablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const logs = [];
const wrangler = spawn(process.execPath, [
  join(repoRoot, 'node_modules/wrangler/bin/wrangler.js'),
  'pages',
  'dev',
  'dist',
  '--port',
  String(port),
], {
  cwd: repoRoot,
  env: { ...process.env, NO_COLOR: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
wrangler.stdout.on('data', (chunk) => logs.push(chunk.toString()));
wrangler.stderr.on('data', (chunk) => logs.push(chunk.toString()));

let browser;
try {
  await waitForServer(`${baseUrl}/`, wrangler, logs);
  const response = await fetch(`${baseUrl}/guestbook/`);
  const policy = response.headers.get('content-security-policy') ?? '';
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.doesNotMatch(policy, /'unsafe-inline'/);
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const violations = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy|Refused to|violat/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  page.on('pageerror', (error) => violations.push(String(error)));
  let guestbookSubmissions = 0;
  await page.route('https://runner.fly.dev/api/v1/languages', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ languages: ['bash'] }),
  }));
  await page.route('**/api/guestbook', (route) => {
    guestbookSubmissions += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-theme-toggle]').click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  await page.goto(`${baseUrl}/guestbook/`, { waitUntil: 'domcontentloaded' });
  const form = page.locator('form[data-guestbook-form]');
  await form.waitFor();
  const actionResponse = await fetch(`${baseUrl}/guestbook-action.json`);
  const action = await actionResponse.json();
  assert.equal(action.target?.urlTemplate, 'https://u64.cam/api/guestbook');
  await page.getByLabel(/Name/).fill('CSP smoke test');
  await page.getByLabel(/^Note/).fill('This request is intercepted locally.');
  await page.getByRole('button', { name: 'Send note' }).click();
  await page.locator('[data-guestbook-status]').filter({ hasText: 'Received for review' }).waitFor();
  assert.equal(guestbookSubmissions, 1);

  await page.goto(`${baseUrl}/notes/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#search-input').fill('coffee');
  await page.locator('#search-results a').first().waitFor();

  await page.goto(`${baseUrl}/codecanvas/`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-status-label]').filter({ hasText: 'Ready' }).waitFor();

  await page.goto(`${baseUrl}/whoop/callback/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#status').filter({ hasText: 'No WHOOP authorization parameters' }).waitFor();

  assert.deepEqual(violations, [], `CSP/runtime violations:\n${violations.join('\n')}`);
  console.log('Strict CSP smoke test passed: headers, theme, configured guestbook, search, CodeCanvas, and WHOOP callback.');
} finally {
  await browser?.close();
  if (wrangler.exitCode === null) wrangler.kill('SIGTERM');
  await new Promise((resolvePromise) => {
    if (wrangler.exitCode !== null) return resolvePromise();
    const timeout = setTimeout(() => {
      wrangler.kill('SIGKILL');
      resolvePromise();
    }, 3000);
    wrangler.once('exit', () => {
      clearTimeout(timeout);
      resolvePromise();
    });
  });
}
