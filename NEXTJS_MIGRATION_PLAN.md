# Zola to Next.js Migration Plan

## Current Site Analysis
- **Framework**: Zola static site generator
- **Theme**: Apollo theme (submodule)
- **Content**: Blog posts, projects, photos with markdown + frontmatter
- **Deployment**: GitHub Pages via GitHub Actions
- **Domain**: u64.cam
- **Analytics**: GoatCounter

## Migration Strategy

### Phase 1: Project Setup
```bash
# Create Next.js project in new directory
npx create-next-app@latest u64-cam-nextjs --typescript --tailwind --eslint --app

# Install required dependencies
npm install gray-matter remark remark-html next-mdx-remote
```

### Phase 2: Content Migration

#### Blog Posts (`content/posts/` → `app/posts/`)
- Convert frontmatter: TOML (`+++`) → YAML (`---`)
- Move markdown files to `content/posts/`
- Create dynamic route: `app/posts/[slug]/page.tsx`

#### Projects (`content/projects/` → `app/projects/`)
- Convert frontmatter format
- Create dynamic route: `app/projects/[slug]/page.tsx`

#### Photos (`content/photos/` → `app/photos/`)
- Handle image processing with Next.js Image component
- Create dynamic route: `app/photos/[slug]/page.tsx`

### Phase 3: Layout & Styling

#### Apollo Theme Conversion
- Extract CSS from `themes/apollo/sass/` and `sass/theme/`
- Convert to Tailwind CSS or CSS modules
- Create reusable components in `components/`

#### Navigation
- Convert menu config from `config.toml` to Next.js component
- Implement social links component

### Phase 4: Static Assets
- Move `static/` → `public/`
- Update image references in markdown
- Implement Next.js Image optimization

### Phase 5: Features

#### RSS Feed
- Create API route: `app/api/feed/route.ts`
- Generate RSS from markdown content

#### Analytics
- Integrate GoatCounter with Next.js
- Migrate from current config

#### Search (Optional)
- Currently disabled in Zola
- Can implement with Flexsearch if needed

### Phase 6: Deployment

#### GitHub Actions Update
- Replace Zola workflow with Next.js static export
- Configure for GitHub Pages deployment

#### Domain Configuration
- Keep existing CNAME setup
- Ensure static export works with GitHub Pages

## Key Files to Create

### Core Application
- `app/layout.tsx` - Main layout with navigation
- `app/page.tsx` - Homepage (from `content/_index.md`)
- `app/posts/[slug]/page.tsx` - Blog post pages
- `app/projects/[slug]/page.tsx` - Project pages
- `app/photos/[slug]/page.tsx` - Photo pages

### Components
- `components/Navigation.tsx` - Main navigation
- `components/SocialLinks.tsx` - Social media links
- `components/Layout.tsx` - Page layout wrapper

### Utilities
- `lib/markdown.ts` - Markdown processing utilities
- `lib/content.ts` - Content fetching functions
- `next.config.js` - Static export configuration

## Migration Complexity Assessment
- **Low**: Content structure (mostly 1:1 mapping)
- **Medium**: Theme conversion (Apollo → React components)
- **High**: Custom styling and interactive features

## Current Site Configuration (from config.toml)
- Base URL: https://u64.cam
- Menu items: /codecanvas, /photos, /projects, /posts
- Social links: GitHub, Stack Overflow, LinkedIn, Hacker News, Spotify, Bluesky
- Analytics: GoatCounter (user: u64cam)
- Theme: Auto (light/dark)

## Next Steps
1. Create Next.js project structure
2. Set up basic routing and layout
3. Convert first blog post as proof of concept
4. Migrate theme styling
5. Set up deployment pipeline
