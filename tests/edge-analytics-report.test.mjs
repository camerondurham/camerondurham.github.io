import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildQueries,
  latestAgeMinutes,
  parseOptions,
} from '../scripts/edge-analytics-report.mjs';

test('edge report validates options and builds sampling-aware queries', () => {
  const options = parseOptions([
    '--dataset=u64_page_requests_preview',
    '--hours=2',
    '--limit=15',
    '--health-max-age-minutes=30',
  ]);
  assert.deepEqual(options, {
    dataset: 'u64_page_requests_preview',
    hours: 2,
    limit: 15,
    healthMaxAgeMinutes: 30,
  });

  const queries = buildQueries(options);
  assert.match(queries.routes, /sum\(_sample_interval\)/);
  assert.match(queries.routes, /FROM u64_page_requests_preview/);
  assert.match(queries.canaries, /index1='canary'/);
  assert.match(queries.latest, /ORDER BY timestamp DESC LIMIT 1/);
});

test('edge report rejects SQL identifiers and unreasonable numeric options', () => {
  assert.throws(() => parseOptions(['--dataset=events; DROP TABLE events']), /SQL identifier/);
  assert.throws(() => parseOptions(['--hours=0']), /hours/);
  assert.throws(() => parseOptions(['--limit=1001']), /limit/);
  assert.throws(() => parseOptions(['--health-max-age-minutes=0']), /health-max-age/);
  assert.throws(() => parseOptions(['--unknown=1']), /Unknown option/);
});

test('edge report computes the latest event age in UTC', () => {
  const now = Date.parse('2026-11-01T03:00:00Z');
  assert.equal(latestAgeMinutes('2026-11-01 02:45:00', now), 15);
  assert.equal(latestAgeMinutes(undefined, now), Infinity);
  assert.equal(latestAgeMinutes('not-a-date', now), Infinity);
});
