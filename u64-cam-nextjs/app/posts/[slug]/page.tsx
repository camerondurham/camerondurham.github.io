import { getPostData, getAllPosts } from '@/lib/markdown'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = getAllPosts('posts')
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  try {
    const post = await getPostData('posts', slug)
    
    return (
      <article className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          {post.date && (
            <time className="text-gray-600 text-sm">
              {new Date(post.date).toLocaleDateString()}
            </time>
          )}
        </header>
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    )
  } catch {
    notFound()
  }
}
