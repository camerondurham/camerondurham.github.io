import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../index.mjs';
import { fixture, submission, origin } from './support.mjs';

test('JSON and form requests store bounded plain text privately and return only a receipt', async t => {
  const f = await fixture(t);
  const input = submission({ name: '  Visitor  ', note: '<script>alert("hi")</script>\r\nplain text', model: 'Self-reported' });
  const response = await f.call(input);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, status: 'received_for_review' });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  const row = await f.db.prepare('SELECT * FROM private_submissions').first();
  assert.equal(row.name, 'Visitor');
  assert.equal(row.note, '<script>alert("hi")</script>\nplain text');
  assert.equal(row.review_state, 'pending');
  assert.equal(row.request_hash.length, 64);
  assert.equal(row.submitter_hash.length, 64);
  const serialized = JSON.stringify(row);
  for (const secret of [input.request_id, input['cf-turnstile-response'], '192.0.2.1', 'synthetic-secret']) {
    assert.ok(!serialized.includes(secret));
  }
  assert.equal((await f.call(submission(), { form: true, headers: { Origin: '' } })).status, 202);
  assert.equal(await f.count(), 2);
});

test('strict validation rejects malformed, oversized, private, duplicate-field and honeypot input before verification', async t => {
  const f = await fixture(t);
  const cases = [
    [{ name: ' ' }], [{ name: 'x'.repeat(81) }], [{ note: '' }], [{ note: 'x'.repeat(2001) }],
    [{ model: 'x'.repeat(81) }], [{ referrer: 'x'.repeat(201) }], [{ name: 123 }],
    [{ email: 'private@example.test' }], [{ review_state: 'reviewed' }], [{ publishedAt: '2026-10-29T00:00:00Z' }],
    [{ note: 'null\u0000byte' }], [{ request_id: 'guessable' }], [{ 'cf-turnstile-response': '' }],
    [{ 'cf-turnstile-response': 'x'.repeat(2049) }], [{ _gotcha: 'spam' }],
  ];
  for (const [data] of cases) assert.equal((await f.call(submission(data))).status, 400, JSON.stringify(data));
  assert.equal((await f.call(null, { raw: '{' })).status, 400);
  assert.equal((await f.call(null, { raw: '[]' })).status, 400);
  assert.equal((await f.call(null, { raw: 'null' })).status, 400);
  assert.equal((await f.call(null, { raw: 'name=a&name=b', form: true })).status, 400);
  assert.equal((await f.call(null, { raw: new Uint8Array([0xff]) })).status, 400);
  assert.equal((await f.call(null, { raw: 'x'.repeat(16385) })).status, 413);
  const chunked = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('x'.repeat(8192)));
    controller.enqueue(new TextEncoder().encode('x'.repeat(8193)));
    controller.close();
  } });
  assert.equal((await f.call(null, { raw: chunked })).status, 413, 'cap also applies without a declared length');
  assert.equal((await f.call(null, { headers: { 'Content-Type': 'multipart/form-data' } })).status, 415);
  assert.equal(f.verifications(), 0);
  assert.equal(await f.count(), 0);
});

test('single-use verification checks hostname and action, and fails closed on provider outages', async t => {
  const f = await fixture(t);
  for (const token of ['invalid', 'wrong-host', 'wrong-action']) {
    assert.equal((await f.call(submission({ 'cf-turnstile-response': token }))).status, 403);
  }
  for (const token of ['outage', 'bad-json']) {
    assert.equal((await f.call(submission({ 'cf-turnstile-response': token }))).status, 503);
  }
  const first = submission();
  assert.equal((await f.call(first)).status, 202);
  assert.equal((await f.call(submission({ 'cf-turnstile-response': first['cf-turnstile-response'] }))).status, 403);
  assert.equal(await f.count(), 1);
});

test('lost receipts, concurrent retries and repeated content do not insert duplicates; changed payload conflicts', async t => {
  const f = await fixture(t);
  const data = submission();
  assert.equal((await f.call(data)).status, 202);
  assert.equal((await f.call(data)).status, 202);
  assert.equal(f.verifications(), 1, 'persisted retry does not reverify a consumed token');
  assert.equal((await f.call({ ...data, note: 'changed' })).status, 409);
  assert.equal((await f.call(submission({ name: data.name, note: data.note }))).status, 202);
  assert.equal(await f.count(), 1);
  const concurrent = submission();
  assert.deepEqual((await Promise.all(Array.from({ length: 5 }, () => f.call(concurrent)))).map(r => r.status), [202, 202, 202, 202, 202]);
  assert.equal(await f.count(), 2);
  const conflict = submission();
  const statuses = (await Promise.all([f.call(conflict), f.call({ ...conflict, note: 'other body' })])).map(r => r.status).sort();
  assert.deepEqual(statuses, [202, 409]);
  assert.equal(await f.count(), 3);
});

test('database admission remains atomic under concurrency and retries do not spend the final slot', async t => {
  const f = await fixture(t);
  const ip = '198.51.100.2';
  const responses = await Promise.all(Array.from({ length: 12 }, () => f.call(submission(), { ip })));
  assert.equal(responses.filter(r => r.status === 202).length, 3);
  assert.equal(responses.filter(r => r.status === 429).length, 9);
  assert.equal(await f.count(), 3);
  // Use distinct clients to exercise the global limit, independently of the IP cap.
  const global = await Promise.all(Array.from({ length: 65 }, () => f.call(submission())));
  assert.equal(global.filter(r => r.status === 202).length, 47);
  assert.equal(global.filter(r => r.status === 429).length, 18);
  assert.equal(await f.count(), 50);
  const row = await f.db.prepare('SELECT name, note FROM private_submissions LIMIT 1').first();
  assert.equal((await f.call(submission(row))).status, 202, 'content duplicate at full capacity is harmless');
  assert.equal(await f.count(), 50);
});

test('edge IP and location limiters reject attempts before verification and D1 admission', async t => {
  const f = await fixture(t, { edgeLimit: 2, locationLimit: 4 });
  const options = { ip: '198.51.100.9' };
  assert.equal((await f.call(submission(), options)).status, 202);
  assert.equal((await f.call(submission(), options)).status, 202);
  const limited = await f.call(submission(), options);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  assert.equal((await f.call()).status, 202);
  assert.equal((await f.call()).status, 429);
  assert.equal(f.verifications(), 3);
  assert.equal(await f.count(), 3);
});

test('there is no public read/admin/export/feed API; CORS permits exactly the configured browser origin', async t => {
  const f = await fixture(t);
  const privateNote = submission({ note: 'PRIVATE-SENTINEL' });
  assert.equal((await f.call(privateNote)).status, 202);
  for (const path of ['/submissions', '/submissions/anything', '/guestbook.json', '/export', '/admin', '/']) {
    const response = await f.call(null, { method: 'GET', url: `https://intake.example.test${path}` });
    assert.ok([404, 405].includes(response.status));
    assert.ok(!(await response.text()).includes('PRIVATE-SENTINEL'));
  }
  assert.equal((await f.call(submission(), { headers: { Origin: 'https://evil.test' } })).status, 403);
  assert.equal((await f.call(submission(), { headers: { Origin: 'null' } })).status, 403);
  const preflight = await f.call(null, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal((await f.call(null, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'DELETE' } })).status, 403);
  // Miniflare supplies CF-Connecting-IP at ingress, like Cloudflare. Invoke the
  // entrypoint directly to model a missing trusted header (no outbound call).
  const env = await f.mf.getBindings();
  const missingIp = new Request('https://intake.example.test/submissions', {
    method: 'POST', headers: { 'X-Forwarded-For': 'fake' }, body: '{}',
  });
  assert.equal((await worker.fetch(missingIp, env)).status, 503);
  assert.equal(await f.count(), 1);
});

test('intake closes when disabled or missing secrets; dummy verification keys cannot run on a public hostname', async t => {
  for (const bindings of [{ INTAKE_ENABLED: 'false' }, { IP_HASH_SECRET: '' }, { TURNSTILE_SECRET_KEY: '' },
    { TURNSTILE_HOSTNAME: 'dummy-key-pass' }, { TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' }]) {
    const f = await fixture(t, { bindings });
    assert.equal((await f.call()).status, 503);
    assert.equal(await f.count(), 0);
    assert.equal(f.verifications(), 0);
  }
});

test('storage failure returns a generic failure, never a false receipt or SQL details', async t => {
  const f = await fixture(t);
  await f.db.prepare('DROP TABLE private_submissions').run();
  const response = await f.call();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: 'intake_unavailable' });
});

test('retention deletes only intake older than 30 days, including reviewed and rejected notes', async t => {
  const f = await fixture(t);
  await f.call(submission());
  await f.call(submission());
  await f.db.prepare("UPDATE private_submissions SET created_at = unixepoch() - 31 * 86400, review_state = 'rejected' WHERE rowid = 1").run();
  await worker.scheduled({}, { DB: f.db });
  assert.equal(await f.count(), 1);
});
