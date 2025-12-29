# Astro.js Migration Plan

## Status: ✅ Complete (14/14 tasks)

## Problem Statement
Migrate personal site from Leptos/WASM to Astro.js (TypeScript), add RSS feed, sitemap, tags system, and deploy to Cloudflare Pages.

## Requirements
- ✅ Astro.js with TypeScript, content collections for all content
- ✅ RSS feed (posts + photos)
- ✅ Auto-generated sitemap
- ✅ Tag system on posts (display now, tag pages later)
- ✅ Client-side search
- ✅ Dark/light theme toggle
- ✅ Deploy to Cloudflare Pages via direct GitHub integration

---

## Tasks

### ✅ Task 1: Project Scaffolding
- Created `astro-rewrite` branch
- Initialized Astro with TypeScript strict mode
- Installed: `@astrojs/rss`, `@astrojs/sitemap`, `pagefind`
- Configured `astro.config.mjs` with site URL

### ✅ Task 2: Content Collections Setup
- Defined schemas in `src/content/config.ts`
- Migrated posts with YAML frontmatter and tags
- Converted projects/photos to markdown files

### ✅ Task 3: Base Layout & Theme Toggle
- Created `BaseLayout.astro` with meta tags, fonts, CSS variables
- Theme toggle with localStorage + system preference
- GoatCounter analytics

### ✅ Task 4: Navigation Component
- Created `Nav.astro` with menu items and social links

### ✅ Task 5: Home/About Page
- Created `src/pages/index.astro`

### ✅ Task 6: Posts List & Detail Pages
- Created `src/pages/posts/index.astro`
- Created `src/pages/posts/[slug].astro`
- Tags displayed on posts

### ✅ Task 7: Projects Page
- Created `src/pages/projects.astro`

### ✅ Task 8: Photos Page
- Created `src/pages/photos.astro`

### ✅ Task 9: RSS Feed
- Created `src/pages/rss.xml.ts` (posts + photos)

### ✅ Task 10: Sitemap
- Auto-generated via `@astrojs/sitemap`
- All routes included

### ✅ Task 11: Client-Side Search
- Installed Pagefind, added to build script
- Created `Search.astro` component on posts page

### ✅ Task 12: 404 Page
- Created `src/pages/404.astro`

### ✅ Task 13: Cloudflare Pages Setup
- Updated README with deployment instructions

### ✅ Task 14: Tag Pages
- Created `src/pages/tags/index.astro` - tag list
- Created `src/pages/tags/[tag].astro` - posts by tag
- Made tags clickable on posts list and detail pages

---

## Commands

```bash
npm run dev      # Dev server at localhost:4321
npm run build    # Production build with Pagefind indexing
npm run preview  # Preview production build
```

## Deployment

Connect GitHub repo to Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`
