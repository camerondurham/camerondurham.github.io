import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const contentDirectory = path.join(process.cwd(), 'content')

export interface PostData {
  slug: string
  title: string
  date?: string
  content: string
  [key: string]: unknown
}

export async function getPostData(section: string, slug: string): Promise<PostData> {
  const fullPath = path.join(contentDirectory, section, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  
  const matterResult = matter(fileContents)
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)
  
  return {
    slug,
    content: processedContent.toString(),
    ...matterResult.data
  } as PostData
}

export function getAllPosts(section: string): PostData[] {
  const sectionPath = path.join(contentDirectory, section)
  
  if (!fs.existsSync(sectionPath)) {
    return []
  }
  
  const fileNames = fs.readdirSync(sectionPath)
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md') && !fileName.startsWith('_'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(sectionPath, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const matterResult = matter(fileContents)
      
      return {
        slug,
        ...matterResult.data
      } as PostData
    })
  
  return allPostsData.sort((a, b) => {
    if (a.date && b.date) {
      return a.date < b.date ? 1 : -1
    }
    return 0
  })
}
