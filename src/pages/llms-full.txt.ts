import { getCollection } from 'astro:content';
import { buildLlmsFullDocument, contentSourcePath } from '../lib/llms-full';

export async function GET() {
  // Import only configured, public-facing collections. Files in ad-hoc folders
  // are excluded unless a collection is deliberately added here.
  const files = import.meta.glob([
    '/src/content/impact/**/*.md',
    '/src/content/photos/**/*.md',
    '/src/content/posts/**/*.md',
    '/src/content/projects/**/*.md',
  ], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const [impact, photos, posts, projects] = await Promise.all([
    getCollection('impact'),
    getCollection('photos'),
    getCollection('posts'),
    getCollection('projects', ({ data }) => data.status !== 'hidden'),
  ]);
  const publicPaths = new Set([
    ...impact.map(({ collection, id }) => contentSourcePath(collection, id)),
    ...photos.map(({ collection, id }) => contentSourcePath(collection, id)),
    ...posts.map(({ collection, id }) => contentSourcePath(collection, id)),
    ...projects.map(({ collection, id }) => contentSourcePath(collection, id)),
  ]);

  return new Response(buildLlmsFullDocument(files, publicPaths), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
