# Cameron Durham's Personal Site

Personal website built with [Astro](https://astro.build/).

## Development

```bash
npm install
npm run dev
```

Site runs at http://localhost:4321

## Build

```bash
npm run build
```

Output in `dist/`. Includes Pagefind search indexing.

## Preview Production Build

```bash
npm run preview
```

## Cloudflare Pages Deployment

### Setup (one-time)

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Create a project → Connect to Git
3. Select this repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** 18 (or latest LTS)
5. Deploy

### Custom Domain

1. In Cloudflare Pages project → Custom domains
2. Add `u64.cam`
3. Update DNS if needed

### Auto-deploy

Pushes to `main` branch auto-deploy to production.

## Project Structure

```
src/
├── components/     # Nav, Search
├── content/        # Markdown content collections
│   ├── posts/      # Blog posts
│   ├── projects/   # Projects
│   └── photos/     # Photo gallery
├── layouts/        # BaseLayout
└── pages/          # Routes
    ├── posts/      # /posts, /posts/[slug]
    ├── 404.astro
    ├── index.astro
    ├── photos.astro
    ├── projects.astro
    └── rss.xml.ts
```

## Adding Content

### New Post

Create `src/content/posts/my-post.md`:

```markdown
---
title: "Post Title"
date: "2025-01-15"
tags: ["tag1", "tag2"]
summary: "Brief description"
---

Content here...
```

### New Project

Create `src/content/projects/my-project.md`:

```markdown
---
title: "Project Name"
date: "2025-01-01"
description: "What it does"
weight: 1
link: "https://github.com/..."
---
```

### New Photo

Create `src/content/photos/my-photo.md`:

```markdown
---
title: "Photo Title"
description: "Description"
image_url: "https://..."
link: "https://..."
weight: 1
---
```

## Features

- RSS feed at `/rss.xml`
- Sitemap at `/sitemap-index.xml`
- Client-side search (Pagefind)
- Dark/light theme toggle
- GoatCounter analytics
