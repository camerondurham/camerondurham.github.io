import { constants } from 'node:fs';
import { lstat, mkdir, open, link, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { guestbookEntryId, guestbookEntrySchema } from '../src/lib/guestbook.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const columns = 'id, created_at, name, note, model, referrer, status';
const usage = `Local D1 review only (untrusted text; keep output private):
  list [--limit 1..50] [--before ID]
  inspect ID
  export ID --slug lowercase-kebab --published-at UTC_ISO [--include model,referrer] [--write]
  reject ID [--write]
Export/reject default to dry-run. Export writes only .wrangler/guestbook-review/;
it never approves a row, writes public content, commits, or deploys.`;

class ReviewError extends Error {}
function fail(message) { throw new ReviewError(message); }
function integer(value, max = Number.MAX_SAFE_INTEGER) {
  if (!/^[1-9]\d*$/.test(value ?? '') || !Number.isSafeInteger(Number(value)) || Number(value) > max) fail('Expected a positive bounded integer.');
  return Number(value);
}

export function parseReviewArgs(args) {
  const [command, ...rest] = args;
  if (!['list', 'inspect', 'export', 'reject'].includes(command)) fail(usage);
  const options = { command };
  if (command !== 'list') options.id = integer(rest.shift());
  const allowed = { list: ['limit', 'before'], inspect: [], export: ['slug', 'published-at', 'include', 'write'], reject: ['write'] }[command];
  while (rest.length) {
    const flag = rest.shift();
    if (!flag.startsWith('--')) fail('Options must start with --.');
    const key = flag.slice(2);
    if (!allowed.includes(key) || Object.hasOwn(options, key)) fail('Unknown or duplicate option.');
    options[key] = key === 'write' ? true : rest.shift();
    if (options[key] === undefined) fail('Missing option value.');
  }
  if (command === 'list') {
    options.limit = integer(options.limit ?? '20', 50);
    options.before = integer(options.before ?? String(Number.MAX_SAFE_INTEGER));
  }
  if (command === 'export') {
    if (typeof options.slug !== 'string' || options.slug.length > 80) fail('A slug of at most 80 characters is required.');
    try { guestbookEntryId(`${options.slug}.json`); } catch { fail('Slug must be lowercase kebab-case, without paths or extensions.'); }
    if (!guestbookEntrySchema.shape.publishedAt.safeParse(options['published-at']).success) fail('A valid UTC ISO --published-at is required.');
    options.include = options.include === undefined ? [] : options.include.split(',');
    if (new Set(options.include).size !== options.include.length || options.include.some(field => !['model', 'referrer'].includes(field))) fail('Include only model and/or referrer, once each.');
  }
  return options;
}

// JSON, not terminal-active text or HTML. Escapes preserve values on JSON.parse.
export function reviewJson(value) {
  return JSON.stringify(value, null, 2).replace(/[<>&\u007f-\u009f\u2028-\u202e\u2066-\u2069]/g,
    char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`) + '\n';
}

async function absent(path) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  fail('Filename already exists; inspect it or choose a different slug. Nothing overwritten.');
}

async function reviewDirectory(workspace, create) {
  let path = workspace;
  for (const part of ['.wrangler', 'guestbook-review']) {
    path = join(path, part);
    if (create) await mkdir(path, { mode: 0o700 }).catch(error => { if (error.code !== 'EEXIST') throw error; });
    let info;
    try { info = await lstat(path); } catch (error) { if (!create && error.code === 'ENOENT') continue; throw error; }
    if (!info.isDirectory() || info.isSymbolicLink()) fail('Review directories must be real directories, never symlinks.');
    if (part === 'guestbook-review' && (info.mode & 0o077)) fail('Private review directory must have mode 0700.');
  }
  return path;
}

// Exclusive hard-link promotion exposes only a complete file, never overwrites,
// and cleans up a failed write. This is a local operator tool, not a sandbox
// against a hostile process running as the same OS user.
async function writeCandidate(directory, target, text) {
  const temporary = join(directory, `.draft-${randomUUID()}`);
  let file;
  let created = false;
  try {
    file = await open(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    created = true;
    await file.writeFile(text);
    await file.close(); file = undefined;
    await link(temporary, target);
  } finally {
    try { await file?.close(); } finally {
      if (created) await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
  }
}

export async function review(db, options, workspace = root) {
  if (options.command === 'list') {
    const { results } = await db.prepare("SELECT id, created_at, substr(name, 1, 80) AS name FROM guestbook_submissions WHERE status = 'pending' AND id < ? ORDER BY id DESC LIMIT ?")
      .bind(options.before, options.limit + 1).all();
    const rows = results.slice(0, options.limit);
    return { pending: rows, nextBefore: results.length > options.limit ? rows.at(-1).id : null };
  }
  const row = await db.prepare(`SELECT ${columns} FROM guestbook_submissions WHERE id = ?`).bind(options.id).first();
  if (!row) fail('No row with that ID in this local database.');
  if (options.command === 'inspect') return row;
  if (options.command === 'reject') {
    if (row.status === 'rejected') return { id: row.id, status: 'rejected', changed: false };
    if (row.status !== 'pending') fail('Only pending rows may be rejected.');
    if (!options.write) return { id: row.id, action: 'reject', dryRun: true };
    const updated = await db.prepare("UPDATE guestbook_submissions SET status = 'rejected' WHERE id = ? AND status = 'pending' RETURNING id")
      .bind(options.id).first();
    if (!updated) fail('Row changed during review; inspect again.');
    return { id: row.id, status: 'rejected', changed: true };
  }
  if (row.status !== 'pending') fail('Only pending rows may be exported; inspect status before proceeding.');
  const selected = { name: row.name, note: row.note, publishedAt: options['published-at'] };
  for (const field of options.include) if (row[field] !== null) selected[field] = row[field];
  const parsed = guestbookEntrySchema.safeParse(selected);
  if (!parsed.success) fail('Row does not meet the public entry schema. No file written.');
  const filename = `${options.slug}.json`;
  await absent(join(workspace, 'src/content/guestbook', filename));
  const directory = await reviewDirectory(workspace, !!options.write);
  const target = join(directory, filename);
  await absent(target);
  if (options.write) await writeCandidate(directory, target, reviewJson(parsed.data));
  return { id: row.id, status: 'pending', dryRun: !options.write, candidate: `.wrangler/guestbook-review/${filename}`, entry: parsed.data };
}

export async function openLocalReview(state = process.env.GUESTBOOK_STATE_DIR || join(root, '.wrangler/guestbook')) {
  process.env.WRANGLER_SEND_METRICS = 'false';
  process.env.WRANGLER_LOG_PATH = join(root, '.wrangler/logs');
  const { getPlatformProxy } = await import('wrangler');
  // CLI --persist-to appends v3; the programmatic API expects that suffix itself.
  // remoteBindings:false is explicit even if the local config changes later.
  return getPlatformProxy({ configPath: join(root, 'wrangler.local.jsonc'), envFiles: [], remoteBindings: false, persist: { path: join(resolve(state), 'v3') } });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let proxy;
  try {
    if (process.argv[2] === '--help' && process.argv.length === 3) console.log(usage);
    else {
      const options = parseReviewArgs(process.argv.slice(2));
      proxy = await openLocalReview();
      process.stdout.write(reviewJson(await review(proxy.env.DB, options)));
    }
  } catch (error) {
    // D1 errors can contain SQL; schema errors can contain submitted values.
    // Only our explicit validation messages are printed, never upstream errors.
    console.error(error instanceof ReviewError ? error.message : 'Local review failed; check migration, state path, and filesystem permissions. Inspect before retrying.');
    process.exitCode = 1;
  } finally { await proxy?.dispose(); }
}
