import {
  buildGuestbookWriteAction,
  guestbookSubmissionUrl,
} from '../lib/guestbook';

export function GET({ site }: { site: URL | undefined }) {
  const formUrl = guestbookSubmissionUrl(import.meta.env.PUBLIC_GUESTBOOK_BACKEND);
  if (!formUrl) {
    return new Response(JSON.stringify({ error: 'Guestbook intake is unavailable.' }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(buildGuestbookWriteAction(new URL(formUrl, site).href), null, 2), {
    headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
  });
}
