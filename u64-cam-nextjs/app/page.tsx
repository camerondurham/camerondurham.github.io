export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">about</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          I&apos;m an SDE II at Amazon, working on catalog indexing for the third-party seller listing platform. 
          I contributed to the{' '}
          <a 
            href="https://www.aboutamazon.com/news/retail/affordable-products-amazon-20-dollars-and-under"
            className="text-blue-600 hover:underline"
          >
            Amazon Haul
          </a>{' '}
          listing experience and work with streaming data processing for distributed search indexing. 
          I also contribute to{' '}
          <a 
            href="https://github.com/camerondurham/open-source-contributions"
            className="text-blue-600 hover:underline"
          >
            open-source projects
          </a>{' '}
          I use.
        </p>
        <p>
          Previously, I was a lead course producer for{' '}
          <a 
            href="https://bytes.usc.edu/cs104/"
            className="text-blue-600 hover:underline"
          >
            USC&apos;s CS104 class
          </a>
          , developing{' '}
          <a 
            href="https://github.com/csci104/docker"
            className="text-blue-600 hover:underline"
          >
            containerized tools
          </a>{' '}
          for the class environment. I interned at Tesla, where I worked on containerized infotainment UIs 
          for all Tesla car models. Before Tesla, I had internships at Amazon and Oracle.
        </p>
      </div>
    </div>
  )
}
