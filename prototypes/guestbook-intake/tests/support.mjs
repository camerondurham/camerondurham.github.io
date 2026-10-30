import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Miniflare, Response } from 'miniflare';

export const origin = 'https://u64.cam';
export function submission(overrides = {}) {
  return { request_id: randomUUID(), name: 'Fixture visitor', note: `Fixture note ${randomUUID()}`,
    'cf-turnstile-response': randomUUID(), ...overrides };
}

export async function fixture(t, { bindings = {}, edgeLimit = 10000, locationLimit = 10000 } = {}) {
  let verifications = 0;
  let client = 0;
  const usedTokens = new Map();
  const mf = new Miniflare({
    modules: true, scriptPath: new URL('../index.mjs', import.meta.url).pathname,
    compatibilityDate: '2026-01-01', d1Databases: ['DB'],
    bindings: {
      INTAKE_ENABLED: 'true', ALLOWED_ORIGIN: origin, TURNSTILE_HOSTNAME: 'u64.cam',
      TURNSTILE_SECRET_KEY: 'synthetic-secret', IP_HASH_SECRET: 'synthetic-hmac-secret-with-at-least-32-bytes',
      ...bindings,
    },
    ratelimits: {
      IP_LIMITER: { namespace_id: '64001', simple: { limit: edgeLimit, period: 60 } },
      LOCATION_LIMITER: { namespace_id: '64002', simple: { limit: locationLimit, period: 60 } },
    },
    // Every outbound request is intercepted; tests never call Cloudflare services.
    outboundService: async request => {
      assert.equal(request.url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.equal(request.method, 'POST');
      const body = await request.json();
      assert.equal(body.secret, 'synthetic-secret');
      assert.ok(body.remoteip);
      assert.ok(body.idempotency_key);
      verifications++;
      if (body.response === 'outage') return new Response('unavailable', { status: 503 });
      if (body.response === 'bad-json') return new Response('bad-json');
      const previous = usedTokens.get(body.response);
      const success = body.response !== 'invalid' && (!previous || previous === body.idempotency_key);
      usedTokens.set(body.response, body.idempotency_key);
      return Response.json({ success,
        hostname: body.response === 'wrong-host' ? 'evil.test' : 'u64.cam',
        action: body.response === 'wrong-action' ? 'login' : 'guestbook' });
    },
  });
  t.after(() => mf.dispose());
  const db = await mf.getD1Database('DB');
  const migration = (await readFile(new URL('../migrations/0001_private_intake.sql', import.meta.url), 'utf8'))
    .replace(/--[^\n]*/g, '').trim();
  // Keep the trigger BEGIN...END body intact; apply the real migration SQL.
  const statements = migration.split(/;\s*(?=CREATE\b|$)/).map(s => s.trim()).filter(Boolean);
  await db.batch(statements.map(sql => db.prepare(sql)));
  return {
    mf, db, verifications: () => verifications,
    count: async () => (await db.prepare('SELECT COUNT(*) AS count FROM private_submissions').first()).count,
    call(data = submission(), options = {}) {
      const { ip = `192.0.2.${++client}`, url = 'https://intake.example.test/submissions',
        method = 'POST', headers = {}, form = false, raw } = options;
      return mf.dispatchFetch(url, {
        method,
        headers: { Origin: origin, 'CF-Connecting-IP': ip,
          'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json', ...headers },
        ...(!['GET', 'HEAD', 'OPTIONS'].includes(method)
          ? { body: raw ?? (form ? new URLSearchParams(data).toString() : JSON.stringify(data)), duplex: 'half' } : {}),
      });
    },
  };
}
