#!/usr/bin/env node

import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, value] = argument.replace(/^--/, '').split('=');
    return [key, value ?? 'true'];
  }),
);
const mode = args.get('mode') ?? 'configured';
const port = Number(args.get('port') ?? 4322);
if (!['configured', 'empty'].includes(mode) || !Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('Use --mode=configured|empty and a port between 1024 and 65535.');
}
const workspace = await mkdtemp(join(tmpdir(), 'u64-guestbook-test-'));
const astroCli = join(repoRoot, 'node_modules/astro/bin/astro.mjs');
const pagefindCli = join(repoRoot, 'node_modules/pagefind/lib/runner/bin.cjs');
const formUrl = 'https://formspree.io/f/testform123';

const fixtureEntries = [
  {
    name: 'Newest Visitor',
    note: 'A current note with a newline.\nIt stays plain text.',
    model: 'Luna',
    referrer: 'the test suite',
    publishedAt: '2026-10-24T12:00:00Z',
    file: 'newest-visitor.json',
  },
  {
    name: 'A Very Long Visitor Name That Is Deliberately Longer Than Typical Display Width',
    note: 'The long-name fixture checks narrow layouts without changing the published data.',
    publishedAt: '2026-10-23T12:00:00Z',
    file: 'long-visitor.json',
  },
  {
    name: 'Unsafe <script>alert("name")</script>',
    note: '<script>alert("note")</script> & <img src=x onerror=alert(1)>',
    model: 'Model <b>shape</b>',
    referrer: 'Referrer <em>shape</em>',
    publishedAt: '2026-10-22T12:00:00Z',
    file: 'unsafe-text.json',
  },
  {
    name: 'Earlier Visitor',
    note: 'An older approved note.',
    publishedAt: '2026-10-01T12:00:00Z',
    file: 'earlier-visitor.json',
  },
];

let preview;
let activeChild;
let cleanupPromise;

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolvePromise) => {
    const timeout = setTimeout(() => child.kill('SIGKILL'), 3000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolvePromise();
    });
    child.kill('SIGTERM');
  });
}

function clean() {
  cleanupPromise ??= (async () => {
    await Promise.all([stop(preview), stop(activeChild)]);
    await rm(workspace, { recursive: true, force: true });
  })();
  return cleanupPromise;
}

async function fail(message, error) {
  console.error(message, error);
  await clean();
  process.exit(1);
}

async function copyWorkspace() {
  // Copy only build inputs: never .env files, Git history, or prior test reports.
  for (const path of ['src', 'public', 'tsconfig.json', 'package.json']) {
    await cp(join(repoRoot, path), join(workspace, path), { recursive: true });
  }
  await cp(join(repoRoot, 'astro.config.mjs'), join(workspace, 'astro.base.config.mjs'));
  // node_modules is shared, but Astro's mutable content cache must not be.
  await writeFile(join(workspace, 'astro.config.mjs'), `
import config from './astro.base.config.mjs';
export default { ...config, cacheDir: './.astro-test-cache/' };
`);
  await symlink(join(repoRoot, 'node_modules'), join(workspace, 'node_modules'), 'dir');

  const guestbookDirectory = join(workspace, 'src/content/guestbook');
  await rm(guestbookDirectory, { recursive: true, force: true });
  await mkdir(guestbookDirectory, { recursive: true });
  if (mode === 'configured') {
    await Promise.all(
      fixtureEntries.map(({ file, ...entry }) =>
        writeFile(join(guestbookDirectory, file), `${JSON.stringify(entry, null, 2)}\n`),
      ),
    );
  }
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: workspace,
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
    });
    activeChild = child;
    const finish = () => {
      if (activeChild === child) activeChild = undefined;
    };
    child.once('error', (error) => {
      finish();
      reject(error);
    });
    child.once('exit', (code, signal) => {
      finish();
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

async function waitForPreview() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/guestbook/`);
      if (response.status === 200) return;
    } catch {
      // Astro preview is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Timed out waiting for Astro preview on port ${port}`);
}

async function main() {
  await copyWorkspace();
  const buildOptions = { env: { PUBLIC_GUESTBOOK_FORM_URL: mode === 'configured' ? formUrl : '' } };
  if (mode === 'empty') {
    // A second build must remove the final approved entry even with a warm cache.
    const deletedEntry = join(workspace, 'src/content/guestbook/deleted-visitor.json');
    await writeFile(deletedEntry, JSON.stringify({
      name: 'Deleted Visitor', note: 'This note must disappear after removal.', publishedAt: '2026-10-22T12:00:00Z',
    }));
    await run(process.execPath, [astroCli, 'build'], buildOptions);
    await rm(deletedEntry);
  }
  await run(process.execPath, [astroCli, 'build'], buildOptions);
  await run(process.execPath, [pagefindCli, '--site', 'dist']);
  // Launch Node directly so shutdown also terminates the listening process.
  preview = spawn(process.execPath, [astroCli, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: workspace,
    env: process.env,
    stdio: 'inherit',
  });
  preview.once('error', (error) => void fail('Astro preview failed to start', error));
  preview.once('exit', (code) => {
    if (!cleanupPromise) void fail('Astro preview stopped unexpectedly', code);
  });
  await waitForPreview();
  console.log(`Guestbook test server (${mode}) listening on http://127.0.0.1:${port}`);
}

process.once('SIGINT', () => void clean().then(() => process.exit(130)));
process.once('SIGTERM', () => void clean().then(() => process.exit(143)));
process.once('exit', () => rmSync(workspace, { recursive: true, force: true }));

main().catch((error) => void fail('Guestbook test server failed', error));
