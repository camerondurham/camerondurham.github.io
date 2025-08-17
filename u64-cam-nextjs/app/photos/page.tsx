import { getAllPosts } from '@/lib/markdown'
import Link from 'next/link'
import Image from 'next/image'

export default function Photos() {
  const photos = getAllPosts('photos')
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Photos</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => {
          const imageUrl = (photo.extra as { image?: string })?.image
          return (
            <article key={photo.slug} className="group">
              <Link href={`/photos/${photo.slug}`}>
                {imageUrl && (
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <Image
                      src={`/${imageUrl}`}
                      alt={photo.title}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <h2 className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                  {photo.title}
                </h2>
              </Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
