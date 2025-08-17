import Link from 'next/link'

const menuItems = [
  { name: '/codecanvas', url: '/codecanvas', weight: 2 },
  { name: '/photos', url: '/photos', weight: 2 },
  { name: '/projects', url: '/projects', weight: 2 },
  { name: '/posts', url: '/posts', weight: 3 },
]

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between py-4 px-4 max-w-4xl mx-auto">
        <Link 
          href="/" 
          className="text-xl font-bold transition-colors"
          style={{ color: 'var(--primary-color)' }}
        >
          u64.cam
        </Link>
        <div className="flex space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.url}
              className="transition-colors hover:opacity-70"
              style={{ color: 'var(--text-1)' }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
