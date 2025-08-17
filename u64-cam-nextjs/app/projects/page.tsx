import { getAllPosts } from '@/lib/markdown'
import Link from 'next/link'

export default function Projects() {
  const projects = getAllPosts('projects')
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Projects</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <article key={project.slug} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">
              <Link 
                href={`/projects/${project.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                {project.title}
              </Link>
            </h2>
          </article>
        ))}
      </div>
    </div>
  )
}
