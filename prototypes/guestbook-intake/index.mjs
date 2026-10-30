const MAX_BODY_BYTES = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = new Set(['request_id', 'name', 'note', 'model', 'referrer', '_gotcha', 'cf-turnstile-response']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

class Rejection extends Error {
  constructor(status, code) { super(code); this.status = status; }
}

function reply(status, code, origin, retryAfter) {
  return new Response(JSON.stringify(status === 202
    ? { ok: true, status: 'received_for_review' } : { ok: false, error: code }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin',
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
    },
  });
}

async function readBody(request) {
  const declared = request.headers.get('Content-Length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw new Rejection(413, 'body_too_large');
  }
  if (!request.body) throw new Rejection(400, 'invalid_body');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Rejection(408, 'body_timeout')), 5000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([
        reader.read(),
        deadline,
      ]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Rejection(413, 'body_too_large');
      chunks.push(value);
    }
  } finally {
    clearTimeout(timeout);
    // Do not wait for a malicious streaming sender to acknowledge cancellation.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Rejection(400, 'invalid_body'); }
}

async function parseSubmission(request) {
  const type = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) {
    throw new Rejection(415, 'unsupported_media_type');
  }
  const text = await readBody(request);
  let data;
  try {
    if (type === 'application/json') {
      data = JSON.parse(text);
    } else {
      data = Object.create(null);
      for (const [key, value] of new URLSearchParams(text)) {
        if (Object.hasOwn(data, key)) throw new Error('Repeated form field');
        data[key] = value;
      }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid object');
    if (Object.keys(data).some(key => !FIELDS.has(key) || typeof data[key] !== 'string')) {
      throw new Error('Unknown field or invalid type');
    }
    const field = (key, max, required = false) => {
      const value = (data[key] ?? '').trim().replace(/\r\n?/g, '\n');
      if ((required && !value) || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) {
        throw new Error('Invalid field');
      }
      return value;
    };
    if (!UUID.test(data.request_id ?? '')) throw new Error('UUID v4 required');
    if ((data._gotcha ?? '').trim()) throw new Rejection(400, 'spam_rejected');
    return {
      requestId: data.request_id.toLowerCase(),
      payload: {
        name: field('name', 80, true), note: field('note', 2000, true),
        model: field('model', 80), referrer: field('referrer', 200),
      },
      token: field('cf-turnstile-response', 2048, true),
    };
  } catch (error) {
    if (error instanceof Rejection) throw error;
    throw new Rejection(400, 'invalid_submission');
  }
}

async function hmac(key, value) {
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(secret, token, ip, hostname, requestId) {
  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip, idempotency_key: requestId }),
      signal: AbortSignal.timeout(5000),
    });
    if (!result.ok) throw new Error('Verification unavailable');
    const body = await result.json();
    // Test-key responses have no action; this exception is loopback-only in fetch().
    if (body.success !== true || body.hostname !== hostname ||
        (hostname !== 'dummy-key-pass' && body.action !== 'guestbook')) {
      throw new Rejection(403, 'verification_failed');
    }
  } catch (error) {
    if (error instanceof Rejection) throw error;
    throw new Rejection(503, 'verification_unavailable');
  }
}

async function duplicate(db, requestHash, payloadHash, day) {
  const existing = await db.prepare(
    'SELECT payload_hash FROM private_submissions WHERE request_hash = ?',
  ).bind(requestHash).first();
  if (existing) {
    if (existing.payload_hash !== payloadHash) throw new Rejection(409, 'request_id_conflict');
    return true;
  }
  return Boolean(await db.prepare(
    'SELECT 1 FROM private_submissions WHERE received_day = ? AND payload_hash = ?',
  ).bind(day, payloadHash).first());
}

export default {
  async fetch(request, env) {
    let corsOrigin;
    try {
      const url = new URL(request.url);
      if (url.pathname !== '/submissions' || url.search) return reply(404, 'not_found');
      if (!['POST', 'OPTIONS'].includes(request.method)) return reply(405, 'method_not_allowed');
      if (env.INTAKE_ENABLED !== 'true') return reply(503, 'intake_closed');
      if (!env.DB || !env.IP_LIMITER || !env.LOCATION_LIMITER ||
          !env.TURNSTILE_SECRET_KEY || env.IP_HASH_SECRET?.length < 32 || !env.IP_HASH_SECRET ||
          !env.ALLOWED_ORIGIN || !env.TURNSTILE_HOSTNAME) return reply(503, 'intake_unconfigured');
      if ((!LOCAL_HOSTS.has(url.hostname)) &&
          (env.TURNSTILE_HOSTNAME === 'dummy-key-pass' || /^\dx0{10}/.test(env.TURNSTILE_SECRET_KEY))) {
        return reply(503, 'intake_unconfigured');
      }
      const origin = request.headers.get('Origin');
      if (origin && origin !== env.ALLOWED_ORIGIN) return reply(403, 'origin_rejected');
      corsOrigin = origin || undefined;
      if (request.method === 'OPTIONS') {
        if (!origin || request.headers.get('Access-Control-Request-Method') !== 'POST' ||
            (request.headers.get('Access-Control-Request-Headers') ?? '').split(',')
              .some(header => header.trim() && header.trim().toLowerCase() !== 'content-type')) {
          return reply(403, 'preflight_rejected');
        }
        return new Response(null, { status: 204, headers: {
          'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin', 'Cache-Control': 'no-store',
        } });
      }
      // Only trust Cloudflare's ingress header, never X-Forwarded-For or client UUID.
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return reply(503, 'client_address_unavailable', corsOrigin);
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.IP_HASH_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const day = new Date().toISOString().slice(0, 10);
      const submitterHash = await hmac(key, `ip:${day}:${ip}`);
      if (!(await env.LOCATION_LIMITER.limit({ key: 'guestbook' })).success ||
          !(await env.IP_LIMITER.limit({ key: submitterHash })).success) {
        return reply(429, 'rate_limited', corsOrigin, 60);
      }
      const { requestId, payload, token } = await parseSubmission(request);
      const requestHash = await hmac(key, `request:${requestId}`);
      const payloadHash = await hmac(key, `payload:${JSON.stringify(payload)}`);
      // A lost success response can be retried without re-consuming a single-use
      // Turnstile token. A replay returns only the same generic receipt, no data.
      if (await duplicate(env.DB, requestHash, payloadHash, day)) return reply(202, '', corsOrigin);
      await verifyToken(env.TURNSTILE_SECRET_KEY, token, ip, env.TURNSTILE_HOSTNAME, requestId);
      try {
        await env.DB.prepare(`INSERT INTO private_submissions
          (request_hash, payload_hash, submitter_hash, name, note, model, referrer)
          VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`)
          .bind(requestHash, payloadHash, submitterHash, payload.name, payload.note, payload.model, payload.referrer).run();
      } catch (error) {
        if (/guestbook_(daily|ip)_limit/.test(String(error))) {
          return reply(429, 'admission_limit', corsOrigin, 3600);
        }
        throw error;
      }
      // Resolve concurrent duplicate inserts, including same key/different body.
      if (!await duplicate(env.DB, requestHash, payloadHash, day)) throw new Error('Write unconfirmed');
      return reply(202, '', corsOrigin);
    } catch (error) {
      if (error instanceof Rejection) return reply(error.status, error.message, corsOrigin);
      // Never log request bodies, tokens, IPs, SQL exceptions, or database rows.
      return reply(503, 'intake_unavailable', corsOrigin);
    }
  },
  async scheduled(_controller, env) {
    // Future activation requires an owner-configured cron; none is configured.
    await env.DB.prepare('DELETE FROM private_submissions WHERE created_at < unixepoch() - 30 * 86400').run();
  },
};
