import { getAllPosts } from '@/lib/markdown'
import Link from 'next/link'

export default function Posts() {
  const posts = getAllPosts('posts')
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Posts</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-6">
            <h2 className="text-2xl font-semibold mb-2">
              <Link 
                href={`/posts/${post.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {post.title}
              </Link>
            </h2>
            {post.date && (
              <time className="text-gray-600 text-sm">
                {new Date(post.date).toLocaleDateString()}
              </time>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
