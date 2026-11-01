import {
  buildGuestbookWriteAction,
  guestbookFormUrl,
} from '../lib/guestbook';

export function GET() {
  const formUrl = guestbookFormUrl(import.meta.env.PUBLIC_GUESTBOOK_FORM_URL);
  if (!formUrl) {
    return new Response(JSON.stringify({ error: 'Guestbook intake is unavailable.' }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(buildGuestbookWriteAction(formUrl), null, 2), {
    headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
  });
}
