import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildGuestbookFeed,
  guestbookEntrySchema,
  guestbookEntryId,
  guestbookFormUrl,
} from '../src/lib/guestbook.ts';

test('publication accepts a bounded plain-text note, not private inbox fields', () => {
  const entry = {
    name: '  Passing agent  ',
    note: '<script>alert("hello")</script>\nA plain-text note.',
    publishedAt: '2026-10-22T12:00:00Z',
  };
  const parsed = guestbookEntrySchema.parse(entry);
  assert.equal(parsed.name, 'Passing agent');
  assert.equal(parsed.note, entry.note);
  assert.equal(guestbookEntrySchema.safeParse({ ...entry, email: 'private@example.test' }).success, false);
  assert.equal(guestbookEntrySchema.safeParse({ ...entry, note: ' ' }).success, false);
  assert.equal(guestbookEntrySchema.safeParse({ ...entry, note: 'x'.repeat(2001) }).success, false);
  assert.equal(guestbookEntrySchema.safeParse({ ...entry, name: 'x'.repeat(81) }).success, false);
  assert.equal(guestbookEntrySchema.safeParse({ ...entry, publishedAt: 'yesterday' }).success, false);
});

test('the public feed has stable URLs, newest-first entries, and plain text only', () => {
  const entries = [
    { id: 'older', data: { name: 'Older agent', note: 'First note', publishedAt: '2026-10-21T12:00:00Z' } },
    { id: 'newer', data: { name: 'Newer agent', note: '<b>Not HTML</b>', model: 'Self-reported', referrer: 'A link', publishedAt: '2026-10-22T12:00:00Z' } },
  ];
  const feed = buildGuestbookFeed(entries, new URL('https://u64.cam'));
  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1');
  assert.equal(feed.home_page_url, 'https://u64.cam/guestbook/');
  assert.equal(feed.feed_url, 'https://u64.cam/guestbook.json');
  assert.deepEqual(feed.items.map(item => item.id), [
    'https://u64.cam/guestbook/#newer',
    'https://u64.cam/guestbook/#older',
  ]);
  assert.deepEqual(feed.items[0], {
    id: 'https://u64.cam/guestbook/#newer',
    url: 'https://u64.cam/guestbook/#newer',
    content_text: '<b>Not HTML</b>',
    date_published: '2026-10-22T12:00:00Z',
    authors: [{ name: 'Newer agent' }],
    _model: 'Self-reported',
    _referrer: 'A link',
  });
  assert.equal('content_html' in feed.items[0], false);
  assert.equal('_model' in feed.items[1], false);
  assert.equal(entries[0].id, 'older', 'sorting must not mutate callers');
  assert.deepEqual(buildGuestbookFeed([], new URL('https://u64.cam')).items, []);
});

test('entry filenames are stable fragment identifiers, not mutable titles', () => {
  assert.equal(guestbookEntryId('first-visit.json'), 'first-visit');
  for (const filename of ['nested/note.json', 'Uppercase.json', 'has space.json', 'bad#id.json', 'note.md']) {
    assert.throws(() => guestbookEntryId(filename), /filename/);
  }
});

test('intake stays closed without configuration and rejects unsafe or mistaken endpoints', () => {
  assert.equal(guestbookFormUrl(undefined), undefined);
  assert.equal(guestbookFormUrl('  '), undefined);
  assert.equal(guestbookFormUrl(' https://formspree.io/f/abc123 '), 'https://formspree.io/f/abc123');
  for (const value of ['javascript:alert(1)', 'http://formspree.io/f/abc123', 'https://evil.test/f/abc123', 'https://formspree.io/f/abc123?token=private', 'https://formspree.io/f/']) {
    assert.throws(() => guestbookFormUrl(value), /PUBLIC_GUESTBOOK_FORM_URL/);
  }
});
