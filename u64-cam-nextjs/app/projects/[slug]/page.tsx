import { getPostData, getAllPosts } from '@/lib/markdown'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const projects = getAllPosts('projects')
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export default async function Project({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  try {
    const project = await getPostData('projects', slug)
    
    return (
      <article className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
        </header>
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: project.content }}
        />
      </article>
    )
  } catch {
    notFound()
  }
}
