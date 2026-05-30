import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    weight: z.number(),
    link: z.string().optional(),
    status: z.string().optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    image_url: z.string().optional(),
    related_note: z.string().optional(),
    related_photo: z.string().optional(),
  }),
});

const photos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image_url: z.string(),
    link: z.string(),
    weight: z.number(),
    year: z.string().optional(),
    location: z.string().optional(),
    story: z.string().optional(),
    tags: z.array(z.string()).default([]),
    related_project: z.string().optional(),
    related_note: z.string().optional(),
  }),
});

const impact = defineCollection({
  type: 'content',
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

const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    hero_image_url: z.string().optional(),
    related_project: z.string().optional(),
    related_photo: z.string().optional(),
  }),
});

export const collections = { posts, projects, photos, impact, notes };
