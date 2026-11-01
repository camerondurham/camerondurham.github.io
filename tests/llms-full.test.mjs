import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildLlmsFullDocument,
  contentSourcePath,
} from '../src/lib/llms-full.ts';

test('llms-full emits only explicitly public markdown sources', () => {
  const publicPath = '/src/content/projects/public.md';
  const hiddenPath = '/src/content/projects/hidden.md';
  const orphanPath = '/src/content/drafts/private.md';
  const document = buildLlmsFullDocument({
    [publicPath]: 'PUBLIC BODY',
    [hiddenPath]: 'HIDDEN BODY',
    [orphanPath]: 'ORPHAN BODY',
  }, new Set([publicPath]));

  assert.match(document, /requests for this file are visible in server analytics/);
  assert.doesNotMatch(document, /https:\/\/u64\.cam-visible/);
  assert.match(document, /PUBLIC BODY/);
  assert.doesNotMatch(document, /HIDDEN BODY|ORPHAN BODY/);
  assert.equal(contentSourcePath('posts', 'nested/example'), '/src/content/posts/nested/example.md');
});

test('llms-full fails closed when an allowlisted source was not imported', () => {
  assert.throws(
    () => buildLlmsFullDocument({}, new Set(['/src/content/posts/missing.md'])),
    /was not imported/,
  );
});
