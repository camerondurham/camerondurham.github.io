import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { guestbookEntryId, guestbookEntrySchema } from './lib/guestbook';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.string().optional(),
    description: z.string().optional(),
    weight: z.number(),
    status: z.enum(['current', 'shipped', 'selected', 'hidden']).default('selected'),
    link: z.string().optional(),
    links: z.array(
      z.object({
        label: z.string(),
        url: z.string().url(),
      })
    ).default([]),
  }),
});

const photos = defineCollection({
  loader: glob({ base: './src/content/photos', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image_url: z.string(),
    link: z.string(),
    weight: z.number(),
  }),
});

const impact = defineCollection({
  loader: glob({ base: './src/content/impact', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    period: z.string().optional(),
    summary: z.string(),
    scope: z.string(),
    outcomes: z.array(z.string()),
    methods: z.array(z.string()),
    visibility: z.string().default('proprietary system'),
    proof: z.array(
      z.object({
        label: z.string(),
        url: z.string().url(),
      })
    ).default([]),
  }),
});

const guestbookFiles = glob({
  base: './src/content/guestbook',
  pattern: '*.json',
  generateId: ({ entry }) => guestbookEntryId(entry),
});

const guestbook = defineCollection({
  loader: {
    ...guestbookFiles,
    async load(context) {
      // Astro 7.1.3's glob loader returns early for an empty directory, leaving
      // cached entries behind. Rebuild this small archive so removals stick.
      context.store.clear();
      await guestbookFiles.load(context);
    },
  },
  schema: guestbookEntrySchema,
});

export const collections = { posts, projects, photos, impact, guestbook };
