import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    date: z.string(),
    description: z.string(),
    weight: z.number(),
    link: z.string().optional(),
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

export const collections = { posts, projects, photos, impact };
