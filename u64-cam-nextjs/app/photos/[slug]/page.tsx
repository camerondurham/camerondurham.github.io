import { getPostData, getAllPosts } from '@/lib/markdown'
import { notFound } from 'next/navigation'
import Image from 'next/image'

export async function generateStaticParams() {
  const photos = getAllPosts('photos')
  return photos.map((photo) => ({
    slug: photo.slug,
  }))
}

export default async function Photo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  try {
    const photo = await getPostData('photos', slug)
    const imageUrl = (photo.extra as { image?: string })?.image
    
    return (
      <article className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{photo.title}</h1>
          {photo.date && (
            <time className="text-gray-600 text-sm">
              {new Date(photo.date).toLocaleDateString()}
            </time>
          )}
        </header>
        {imageUrl && (
          <div className="mb-8">
            <Image
              src={`/${imageUrl}`}
              alt={photo.title}
              width={800}
              height={600}
              className="rounded-lg"
            />
          </div>
        )}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: photo.content }}
        />
      </article>
    )
  } catch {
    notFound()
  }
}
