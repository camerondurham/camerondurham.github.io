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
   - **Node.js version:** 20 (or latest LTS)
5. Deploy

### Wrangler (CLI deploys / CI)

If you deploy with Wrangler, use current Pages commands and config:

1. Authenticate: `npx wrangler login`
2. Sync config from Cloudflare (recommended): `npx wrangler pages download config <PROJECT_NAME>`
3. Ensure `wrangler.jsonc` includes `"pages_build_output_dir": "dist"`
4. Deploy: `npx wrangler pages deploy dist --project-name <PROJECT_NAME>`

Useful scripts:

```bash
npm run cf:deploy
npm run cf:dev
```

Notes:
- Use `wrangler pages deploy` (not old publish-style commands).
- A stale `wrangler.toml/jsonc` can override dashboard assumptions and cause deploy failures.
- This repo is a static Astro site (`astro build` output), so Cloudflare Pages does not require an Astro server adapter.

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
