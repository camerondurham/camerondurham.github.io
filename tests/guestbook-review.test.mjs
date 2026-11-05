import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseReviewArgs, review, reviewJson } from '../scripts/guestbook-review.mjs';

test('operator arguments reject SQL IDs, path traversal, unexpected flags and unbounded lists', () => {
  for (const id of ['0', '-1', '01', '1.5', '1 OR 1=1', '9007199254740992', '--remote']) {
    assert.throws(() => parseReviewArgs(['inspect', id]));
  }
  for (const args of [['list', '--limit', '51'], ['list', '--limit', '0'], ['list', '--limit'], ['list', '--remote'], ['list', 'limit', '5'], ['inspect', '1', '--write'], ['reject', '1', '--write', '--write']]) {
    assert.throws(() => parseReviewArgs(args));
  }
  const candidate = ['export', '1', '--published-at', '2026-11-05T12:00:00Z'];
  for (const slug of ['../escape', '/tmp/note', 'Upper', 'note.json', 'a/b', 'a\\b', 'a'.repeat(81)]) {
    assert.throws(() => parseReviewArgs([...candidate, '--slug', slug]));
  }
  for (const include of ['status', 'name,note', 'model,model', 'referrer,', '']) {
    assert.throws(() => parseReviewArgs([...candidate, '--slug', 'visit', '--include', include]));
  }
  assert.throws(() => parseReviewArgs(['export', '1', '--slug', 'visit']));
  assert.throws(() => parseReviewArgs(['export', '1', '--slug', 'visit', '--published-at', 'yesterday']));
  assert.deepEqual(parseReviewArgs(['list']), { command: 'list', limit: 20, before: Number.MAX_SAFE_INTEGER });
});

test('terminal-safe JSON preserves plain text, quotes, controls and hostile markup exactly', () => {
  const row = { note: '<script>"&\n\u001b[2J\u009b31m\u202ehidden\u2066</script>' };
  const output = reviewJson(row);
  assert.doesNotMatch(output, /[<>\u001b\u009b\u202e\u2066]/);
  assert.deepEqual(JSON.parse(output), row);
});

test('operator queries bind IDs and pagination, and reject conditionally on pending status', async () => {
  const queries = [];
  const db = { prepare(sql) { return { bind(...values) {
    queries.push({ sql, values });
    return {
      all: async () => ({ results: [{ id: 9 }, { id: 8 }, { id: 7 }] }),
      first: async () => sql.startsWith('UPDATE') ? { id: 42 } : { id: 42, status: 'pending' },
    };
  } }; } };
  assert.deepEqual(await review(db, parseReviewArgs(['list', '--limit', '2', '--before', '10'])), { pending: [{ id: 9 }, { id: 8 }], nextBefore: 8 });
  assert.deepEqual(queries[0].values, [10, 3]);
  await review(db, parseReviewArgs(['reject', '42', '--write']));
  for (const query of queries.slice(1)) {
    assert.deepEqual(query.values, [42]);
    assert.doesNotMatch(query.sql, /42/);
  }
  assert.match(queries.at(-1).sql, /status = 'pending' RETURNING id/);
});

test('database failures and concurrent status changes never claim a rejection succeeded', async () => {
  await assert.rejects(review({ prepare() { throw new TypeError('DB unavailable'); } }, parseReviewArgs(['inspect', '1'])), /unavailable/);
  const db = { prepare(sql) { return { bind() { return { first: async () => sql.startsWith('UPDATE') ? null : { id: 1, status: 'pending' } }; } }; } };
  await assert.rejects(review(db, parseReviewArgs(['reject', '1', '--write'])), /changed during review/);
});
