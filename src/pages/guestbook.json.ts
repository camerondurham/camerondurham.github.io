import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { buildGuestbookFeed } from '../lib/guestbook';

export async function GET({ site }: APIContext) {
  const entries = await getCollection('guestbook');
  return new Response(JSON.stringify(buildGuestbookFeed(entries, site!), null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
