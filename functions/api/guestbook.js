const MAX_BODY = 32768; // Bytes, checked while streaming, before decoding/parsing.
const WINDOW = 600;
const LIMIT = 5;
const fields = { name: 80, note: 2000, model: 80, referrer: 200, _gotcha: 200 };

function reply(status, ok = false, html = false) {
  const message = ok ? 'Received for review. Approved notes appear after a site update.' : 'Unable to accept this note. Please check your draft and try later.';
  return new Response(html
    ? `<!doctype html><html lang="en"><meta charset="utf-8"><title>Guestbook receipt</title><main><h1>Guestbook</h1><p>${message}</p><a href="/guestbook/">Back to guestbook</a></main></html>`
    : JSON.stringify(ok ? { ok: true } : { ok: false, error: message }), {
    status,
    headers: { 'Content-Type': html ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", ...(status === 405 ? { Allow: 'POST' } : {}), ...(status === 429 ? { 'Retry-After': String(WINDOW) } : {}) },
  });
}

async function readBody(request) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY)) throw 413;
  const reader = request.body?.getReader();
  if (!reader) throw 400;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw 413; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
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

async function rateKey(request, env) {
  if (env.GUESTBOOK_IP_MODE === 'local-shared') return 'local-shared';
  // Only enable behind a verified Cloudflare proxy that overwrites this header.
  if (env.GUESTBOOK_IP_MODE !== 'trusted-cf' || !env.GUESTBOOK_IP_SALT || env.GUESTBOOK_IP_SALT.length < 32) throw 503;
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip || ip.length > 64 || !/^[\da-fA-F:.]+$/.test(ip)) throw 503;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.GUESTBOOK_IP_SALT}:${ip}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequest({ request, env }) {
  const html = request.headers.get('accept')?.includes('text/html') && !request.headers.get('accept')?.includes('application/json');
  if (request.method !== 'POST') return reply(405);
  if (env.PUBLIC_GUESTBOOK_BACKEND !== 'd1' || !env.DB?.prepare) return reply(503, false, html);
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if ((origin !== null && origin !== new URL(request.url).origin) || (site && !['same-origin', 'none'].includes(site))) return reply(403, false, html);
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) return reply(415, false, html);
  try {
    const data = validate(await readBody(request), type);
    const key = await rateKey(request, env); // Fail closed even for honeypots.
    if (data._gotcha) return reply(200, true, html);
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / WINDOW) * WINDOW;
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
    return reply([400, 413, 503].includes(error) ? error : error instanceof SyntaxError || error instanceof URIError || error instanceof TypeError ? 400 : 503, false, html);
  }
}
