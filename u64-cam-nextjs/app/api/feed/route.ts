import { getAllPosts } from '@/lib/markdown'

export const dynamic = 'force-static'

export async function GET() {
  const posts = getAllPosts('posts')
  const siteUrl = 'https://u64.cam'
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>u64.cam</title>
    <description>Cameron Durham's personal website</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/api/feed" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid>${siteUrl}/posts/${post.slug}</guid>
      <pubDate>${post.date ? new Date(post.date).toUTCString() : new Date().toUTCString()}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
