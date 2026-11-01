import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parseWranglerConfig } from '../scripts/run-pages.mjs';

const config = parseWranglerConfig(
  await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
);

test('production and preview use separate Analytics Engine datasets', () => {
  assert.equal(config.analytics_engine_datasets, undefined, 'local Pages dev must not require Analytics Engine');
  assert.deepEqual(config.env.production.analytics_engine_datasets, [{
    binding: 'SCRAPER_ANALYTICS',
    dataset: 'u64_page_requests',
  }]);
  assert.deepEqual(config.env.preview.analytics_engine_datasets, [{
    binding: 'SCRAPER_ANALYTICS',
    dataset: 'u64_page_requests_preview',
  }]);
});
