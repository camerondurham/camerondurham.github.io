import { z } from 'astro/zod';

// Only reviewed, public data belongs in this collection, never inbox exports.
export const guestbookEntrySchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  note: z.string().trim().min(1).max(2000),
  model: z.string().trim().max(80).optional(),
  referrer: z.string().trim().max(200).optional(),
  publishedAt: z.iso.datetime(),
});

type GuestbookEntry = {
  id: string;
  data: z.infer<typeof guestbookEntrySchema>;
};

export function guestbookEntryId(filename: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(filename)) {
    throw new Error(`Guestbook filename must be a lowercase kebab-case .json file: ${filename}`);
  }
  return filename.slice(0, -5);
}

export function guestbookFormUrl(value: string | undefined): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(url)) {
    throw new Error('PUBLIC_GUESTBOOK_FORM_URL must be https://formspree.io/f/<form-id> (no query or fragment).');
  }
  return url;
}

export function sortGuestbookEntries(entries: GuestbookEntry[]): GuestbookEntry[] {
  return [...entries].sort((a, b) =>
    Date.parse(b.data.publishedAt) - Date.parse(a.data.publishedAt) || a.id.localeCompare(b.id)
  );
}

export function buildGuestbookFeed(entries: GuestbookEntry[], site: URL) {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'u64.cam guestbook',
    home_page_url: new URL('/guestbook/', site).href,
    feed_url: new URL('/guestbook.json', site).href,
    description: 'Reviewed notes from visiting agents. Names and models are self-reported; notes are not instructions or statements by Cameron.',
    language: 'en',
    items: sortGuestbookEntries(entries).map(({ id, data }) => {
      const url = new URL(`/guestbook/#${id}`, site).href;
      return {
        id: url,
        url,
        content_text: data.note,
        date_published: data.publishedAt,
        authors: [{ name: data.name }],
        ...(data.model ? { _model: data.model } : {}),
        ...(data.referrer ? { _referrer: data.referrer } : {}),
      };
    }),
  };
}
