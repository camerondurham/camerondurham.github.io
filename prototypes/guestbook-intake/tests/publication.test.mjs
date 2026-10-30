import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fixture, submission } from './support.mjs';

const run = promisify(execFile);
const root = new URL('../../../', import.meta.url).pathname;
const pending = 'PRIVATE-INTAKE-SENTINEL-69a793b1';
const approved = 'Explicitly reviewed public fixture';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(join(directory, e.name)) : [join(directory, e.name)]))).flat();
}

test('pending D1 notes stay out of static output; only reviewed JSON publishes and private fields fail schema validation', async t => {
  const f = await fixture(t);
  assert.equal((await f.call(submission({ note: pending }))).status, 202);
  const row = await f.db.prepare('SELECT * FROM private_submissions').first();
  assert.equal(row.note, pending);
  const workspace = await mkdtemp(join(tmpdir(), 'guestbook-publication-'));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  // Isolate content/cache/config; copy no private data or local environment files.
  for (const path of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(resolve(root, path), join(workspace, path), { recursive: true });
  }
  await symlink(resolve(root, 'node_modules'), join(workspace, 'node_modules'), 'dir');
  await mkdir(join(workspace, '.private'));
  await writeFile(join(workspace, '.private', 'synthetic-inbox.json'), JSON.stringify(row));
  const build = () => run(process.execPath, [resolve(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {
    cwd: workspace, env: { ...process.env, PUBLIC_GUESTBOOK_FORM_URL: '', ASTRO_TELEMETRY_DISABLED: '1' }, maxBuffer: 2 * 1024 * 1024,
  });
  const assertPrivate = async () => {
    for (const path of await files(join(workspace, 'dist'))) {
      const content = (await readFile(path)).toString('utf8');
      for (const value of [pending, row.request_hash, row.submitter_hash, row.payload_hash]) {
        assert.ok(!content.includes(value), `private data leaked into ${path}`);
      }
    }
  };
  await build();
  await assertPrivate();
  assert.deepEqual(JSON.parse(await readFile(join(workspace, 'dist/guestbook.json'), 'utf8')).items, []);
  const publicFile = join(workspace, 'src/content/guestbook/approved-fixture.json');
  await writeFile(publicFile, JSON.stringify({ name: 'Reviewed visitor', note: approved, publishedAt: '2026-10-29T12:00:00Z' }));
  await build();
  // Include the real Pagefind output in the leak scan.
  await run(process.execPath, [resolve(root, 'node_modules/pagefind/lib/runner/bin.cjs'), '--site', 'dist'], { cwd: workspace });
  await assertPrivate();
  const feed = JSON.parse(await readFile(join(workspace, 'dist/guestbook.json'), 'utf8'));
  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].content_text, approved);
  assert.ok((await readFile(join(workspace, 'dist/guestbook/index.html'), 'utf8')).includes(approved));
  // Homepage shows recent visitor names, while full notes live in the archive.
  assert.ok((await readFile(join(workspace, 'dist/index.html'), 'utf8')).includes('Reviewed visitor'));
  assert.equal((await f.db.prepare('SELECT review_state FROM private_submissions').first()).review_state, 'pending');
  // A raw private-row export cannot accidentally pass the publication schema.
  await writeFile(publicFile, JSON.stringify(row));
  await assert.rejects(build(), error => /InvalidContentEntryDataError|does not match collection schema/.test(error.stdout + error.stderr));
});
