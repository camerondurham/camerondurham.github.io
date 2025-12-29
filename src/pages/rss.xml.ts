import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');
  const photos = await getCollection('photos');

  const postItems = posts.map(post => ({
    title: post.data.title,
    pubDate: new Date(post.data.date),
    description: post.data.summary || '',
    link: `/posts/${post.slug}/`,
  }));

  const photoItems = photos.map(photo => ({
    title: photo.data.title,
    pubDate: new Date(),
    description: photo.data.description,
    link: photo.data.link,
  }));

  const items = [...postItems, ...photoItems].sort((a, b) => 
    b.pubDate.getTime() - a.pubDate.getTime()
  );

  return rss({
    title: 'Cameron Durham',
    description: 'Posts and photos from Cameron Durham',
    site: context.site!,
    items,
  });
}
