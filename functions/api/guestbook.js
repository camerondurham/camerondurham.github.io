const MAX_BODY = 32768; // Bytes, checked while streaming, before decoding/parsing.
const WINDOW = 600;
const LIMIT = 5;
const READ_TIMEOUT_MS = 5000;
const fields = { name: 80, note: 2000, model: 80, referrer: 200, _gotcha: 200 };

function reply(status, ok = false, html = false) {
  const message = ok ? 'Received for review. Approved notes appear after a site update.' : 'We could not confirm receipt. Use your browser’s Back button to recover your draft. Check before retrying to avoid duplicates.';
  return new Response(html
    ? `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Guestbook receipt</title><main><h1>Guestbook</h1><p role="status">${message}</p><a href="/guestbook/">Back to guestbook</a></main></html>`
    : JSON.stringify(ok ? { ok: true } : { ok: false, error: message }), {
    status,
    headers: {
      'Content-Type': html ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Strict-Transport-Security': 'max-age=31536000',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Content-Security-Policy': "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      ...(status === 405 ? { Allow: 'POST' } : {}),
      ...(status === 429 ? { 'Retry-After': String(WINDOW) } : {}),
    },
  });
}

async function readBody(request) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY)) throw 413;
  const reader = request.body?.getReader();
  if (!reader) throw 400;
  const chunks = [];
  let size = 0;
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { reject(408); void reader.cancel().catch(() => {}); }, READ_TIMEOUT_MS);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { void reader.cancel().catch(() => {}); throw 413; }
      chunks.push(value);
    }
  } finally { clearTimeout(timer); reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw 400; }
}

// Flat string-only JSON grammar preserves duplicate keys so they can be rejected.
function jsonPairs(text) {
  let i = 0;
  const pairs = [];
  const ws = () => { while (/[\x20\t\r\n]/.test(text[i] ?? '') && i < text.length) i++; };
  const take = (char) => { ws(); if (text[i++] !== char) throw 400; };
  const string = () => {
    ws();
    const match = /^"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[\da-fA-F]{4}))*"/.exec(text.slice(i));
    if (!match) throw 400;
    i += match[0].length;
    return JSON.parse(match[0]);
  };
  take('{'); ws();
  if (text[i] !== '}') {
    while (true) {
      const key = string(); take(':'); const value = string(); pairs.push([key, value]); ws();
      if (text[i] !== ',') break;
      i++;
    }
  }
  take('}'); ws(); if (i !== text.length) throw 400;
  return pairs;
}

function validate(text, type) {
  let pairs;
  if (type === 'application/json') pairs = jsonPairs(text);
  else {
    // URLSearchParams tolerates bad percent/UTF-8 sequences; reject them first.
    decodeURIComponent(text.replace(/\+/g, ' '));
    pairs = new URLSearchParams(text);
  }
  const result = Object.create(null);
  for (const [key, value] of pairs) {
    if (!Object.hasOwn(fields, key) || Object.hasOwn(result, key)) throw 400;
    if (value.length > fields[key] || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|[\uD800-\uDFFF]/u.test(value)) throw 400;
    result[key] = value.trim();
  }
  if (!result.name || !result.note) throw 400;
  return result;
}

async function rateKey(request, env, bucket) {
  if (env.GUESTBOOK_IP_MODE === 'local-shared') {
    const url = new URL(request.url);
    // Both an explicit local runtime and a loopback URL are required. Copying
    // the local config to Pages must never enable a shared production bucket.
    if (env.GUESTBOOK_RUNTIME !== 'local' || url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw 503;
    return 'local-shared';
  }
  // Only enable behind a verified Cloudflare proxy that overwrites this header.
  if (env.GUESTBOOK_IP_MODE !== 'trusted-cf' || typeof env.GUESTBOOK_IP_SALT !== 'string' || env.GUESTBOOK_IP_SALT.trim().length < 32 || !request.cf) throw 503;
  let ip = request.headers.get('CF-Connecting-IP');
  if (!ip || ip.length > 45) throw 503;
  if (ip.includes(':')) {
    if (!/^[\da-fA-F:]+$/.test(ip)) throw 503;
    try { ip = new URL(`http://[${ip}]/`).hostname; } catch { throw 503; }
  } else if (!/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(ip) || ip.split('.').some(part => Number(part) > 255)) throw 503;
  const encoder = new TextEncoder();
  const secret = await crypto.subtle.importKey('raw', encoder.encode(env.GUESTBOOK_IP_SALT), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  // Rotate the pseudonym each window; never retain raw addresses or salt in D1.
  const digest = await crypto.subtle.sign('HMAC', secret, encoder.encode(`${bucket}:${ip}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequest({ request, env }) {
  const html = request.headers.get('accept')?.includes('text/html') && !request.headers.get('accept')?.includes('application/json');
  if (request.method !== 'POST') return reply(405, false, html);
  if (env.PUBLIC_GUESTBOOK_BACKEND !== 'd1' || !env.DB?.prepare) return reply(503, false, html);
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if ((origin !== null && origin !== new URL(request.url).origin) || (site && !['same-origin', 'none'].includes(site))) return reply(403, false, html);
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^(application\/json|application\/x-www-form-urlencoded)(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/i.test(contentType) || !['identity', null].includes(request.headers.get('content-encoding'))) return reply(415, false, html);
  const type = contentType.split(';')[0].trim().toLowerCase();
  try {
    const data = validate(await readBody(request), type);
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / WINDOW) * WINDOW;
    const key = await rateKey(request, env, bucket); // Fail closed even for honeypots.
    if (data._gotcha) return reply(200, true, html);
    await env.DB.prepare('DELETE FROM guestbook_rate_limits WHERE rowid IN (SELECT rowid FROM guestbook_rate_limits WHERE expires_at <= ? LIMIT 100)').bind(now).run();
    // Atomic admission: concurrent requests cannot read-then-write past the cap.
    const admitted = await env.DB.prepare(`INSERT INTO guestbook_rate_limits (key, window_start, count, expires_at)
      VALUES (?, ?, 1, ?) ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
      WHERE count < ? RETURNING count`).bind(key, bucket, bucket + WINDOW, LIMIT).first();
    if (!admitted) return reply(429, false, html);
    await env.DB.prepare('INSERT INTO guestbook_submissions (name, note, model, referrer) VALUES (?, ?, ?, ?)')
      .bind(data.name, data.note, data.model || null, data.referrer || null).run();
    return reply(201, true, html);
  } catch (error) {
    return reply([400, 408, 413, 503].includes(error) ? error : error instanceof SyntaxError || error instanceof URIError ? 400 : 503, false, html);
  }
}
