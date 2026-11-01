import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildVariables,
  pagesBuildEnvironment,
  parseWranglerConfig,
} from '../scripts/run-pages.mjs';

const config = parseWranglerConfig(`{
  // JSONC comments are allowed.
  "vars": { "PUBLIC_VALUE": "production", "COUNT": 2 },
  "env": {
    "production": {
      "vars": { "PUBLIC_VALUE": "production-override", "COUNT": 3 }
    },
    "preview": {
      "vars": { "PUBLIC_VALUE": "preview", "ENABLED": true }
    }
  },
}`);

test('Pages builds receive the variables from their matching Wrangler environment', () => {
  assert.deepEqual(buildVariables(config, 'production'), {
    PUBLIC_VALUE: 'production-override',
    COUNT: '3',
  });
  assert.deepEqual(buildVariables(config, 'preview'), {
    PUBLIC_VALUE: 'preview',
    ENABLED: 'true',
  });
  assert.deepEqual(buildVariables({ vars: { FALLBACK: 'top-level' } }, 'production'), {
    FALLBACK: 'top-level',
  });
});

test('Git-integrated Pages builds choose production only for the configured production branch', () => {
  assert.equal(pagesBuildEnvironment({ CF_PAGES_BRANCH: 'main' }), 'production');
  assert.equal(pagesBuildEnvironment({ CF_PAGES_BRANCH: 'feature/test' }), 'preview');
  assert.equal(pagesBuildEnvironment({
    CF_PAGES_BRANCH: 'stable',
    CF_PAGES_PRODUCTION_BRANCH: 'stable',
  }), 'production');
  assert.equal(pagesBuildEnvironment({}), 'production');
});

test('Pages build variables fail closed on invalid configuration values', () => {
  assert.throws(
    () => buildVariables({ vars: { INVALID: { nested: true } } }, 'production'),
    /must be a string, number, or boolean/,
  );
  assert.throws(() => parseWranglerConfig('{ broken'), /Could not parse/);
});
