const MAX_PATH_LENGTH = 512;
const MAX_HEADER_LENGTH = 256;

export function clean(value, limit = MAX_HEADER_LENGTH, fallback = 'unknown') {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim();
  return Array.from(normalized).slice(0, limit).join('') || fallback;
}

function referrerOrigin(value, siteOrigin) {
  if (!value) return 'none';
  try {
    const origin = new URL(value).origin;
    return origin === siteOrigin ? 'self' : clean(origin);
  } catch {
    return 'invalid';
  }
}

export function routeCategory(pathname, contentType = '') {
  const normalizedPath = pathname.toLowerCase().replace(/\/index\.html$/, '/');
  if (normalizedPath === '/guestbook' || normalizedPath === '/guestbook/') return 'guestbook-page';
  if (normalizedPath === '/guestbook.json') return 'guestbook-feed';
  if (normalizedPath === '/guestbook-action.json') return 'guestbook-action';
  if (normalizedPath === '/llms.txt' || normalizedPath === '/llms-full.txt') return 'agent-corpus';
  if (normalizedPath === '/agents-only/sitemap-canary/' || normalizedPath.startsWith('/canary/')) return 'canary';
  if (normalizedPath.startsWith('/agents-only/')) return 'agent-page';
  if (normalizedPath === '/robots.txt') return 'robots';
  if (normalizedPath.startsWith('/sitemap') && normalizedPath.endsWith('.xml')) return 'sitemap';
  if (normalizedPath === '/rss.xml') return 'feed';
  if (contentType.includes('text/html')) return 'page';
  if (contentType.includes('json')) return 'json';
  if (contentType.startsWith('text/')) return 'text';
  return 'other';
}

export function analyticsDataPoint(request, response) {
  const url = new URL(request.url);
  const cf = request.cf ?? {};
  const bot = cf.botManagement ?? {};
  const contentType = response.headers.get('content-type') ?? '';
  const language = request.headers.get('accept-language')?.split(',', 1)[0]?.split(';', 1)[0];
  const purpose = request.headers.get('sec-purpose') ?? request.headers.get('purpose');
  const botClass = bot.verifiedBot
    ? 'verified-bot'
    : bot.signedAgent
      ? 'signed-agent'
      : Number.isFinite(bot.score)
        ? 'scored'
        : 'unavailable';

  return {
    indexes: [routeCategory(url.pathname, contentType)],
    blobs: [
      clean(url.pathname, MAX_PATH_LENGTH, '/'),
      clean(request.method),
      clean(request.headers.get('user-agent')),
      referrerOrigin(request.headers.get('referer'), url.origin),
      clean(cf.country),
      clean(cf.colo),
      clean(cf.asOrganization),
      clean(cf.httpProtocol),
      clean(cf.tlsVersion),
      clean(request.headers.get('accept')),
      clean(language),
      clean(purpose),
      botClass,
    ],
    doubles: [
      response.status,
      Number.isFinite(cf.asn) ? cf.asn : 0,
      Number.isFinite(bot.score) ? bot.score : -1,
      bot.verifiedBot ? 1 : 0,
      bot.signedAgent ? 1 : 0,
    ],
  };
}

export async function onRequest(context) {
  const response = await context.next();
  if (!['GET', 'HEAD'].includes(context.request.method)) return response;

  const analytics = context.env.SCRAPER_ANALYTICS;
  if (!analytics?.writeDataPoint) return response;

  try {
    analytics.writeDataPoint(analyticsDataPoint(context.request, response));
  } catch (error) {
    console.error('Could not record privacy-minimized request analytics', error);
  }

  return response;
}
