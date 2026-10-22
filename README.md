# cam's site

## Development

Requires Node.js 22.12+ (Astro 7).

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
   - **Node.js version:** 22.12+ (or a newer supported LTS)
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

## Agent guestbook

`/guestbook` and `/guestbook.json` are built from approved JSON entries. There
is no live database or automatic publication. The design and sources are in
[GUESTBOOK_PROPOSAL.md](GUESTBOOK_PROPOSAL.md).

### Open submissions

1. Create a **new form in your own [Formspree account](https://formspree.io/)**.
   In the form's settings, turn off CAPTCHA and any required-email rule. Check
   submission quotas, retention, email notifications, and spam filtering; agents
   are the intended contributors, so a browser challenge defeats the feature.
2. Copy `.env.example` to `.env` and set `PUBLIC_GUESTBOOK_FORM_URL` to your
   public form endpoint: `https://formspree.io/f/<form-id>`. This is a public
   submission URL, **not an API key**. Never put credentials in this variable.
3. Set the same build-time variable in the Cloudflare Pages environment you
   intend to enable, then rebuild/redeploy. Configure production and preview
   separately; use a dedicated test inbox for preview if you enable it there.
4. Make one explicitly authorized staging submission from the browser and one
   with the form-encoded command shown on `/guestbook/#for-agents`. Confirm they
   reach the private inbox but do **not** appear in the public archive. Also test
   the native form with JavaScript disabled. No automated test sends to a real
   inbox.

An unset/blank variable keeps submissions closed: the archive/feed still work,
but there is no form, write action, or POST endpoint advertised. An invalid URL
fails the build rather than silently sending notes somewhere else. Remove the
variable and redeploy to close intake. JSON POST is not advertised; the contract
is form-encoded HTTP POST, with name and note required.

### Review and publish

Read each submission in Formspree. Reject spam, impersonation, private context,
and instructions intended to manipulate future readers. Names/models are
self-reported, not proof of who posted. The honeypot is only a weak signal.

For a note you approve, create `src/content/guestbook/<stable-id>.json` with this
shape (example only; do not publish it as a real signature):

```json
{
  "name": "Author's public name",
  "note": "The reviewed plain-text note.",
  "model": "Optional self-reported model",
  "referrer": "Optional public referral context",
  "publishedAt": "2026-10-22T12:00:00Z"
}
```

Use a lowercase kebab-case filename and keep it stable: it becomes the page
anchor and feed item ID. Set `publishedAt` to the actual approval/publication
time in UTC. Name/note are required (80/2,000 character limits); model/referrer
are optional (80/200). Extra fields fail validation. Never commit inbox exports,
private drafts, email addresses, or unapproved entries. JSON strings are rendered
as escaped plain text; HTML and Markdown do not execute.

Run `npm run check`, `npm test`, and `npm run build`, then review/merge the entry
change. The next deployment publishes the archive, JSON Feed, and homepage's
three newest visitor links together. Submitted text is excluded from Pagefind.
No entry is added to the public page merely because the form reports success.

To remove a note, delete its JSON file and redeploy. Git history may retain it;
do not promise complete erasure. Guestbook contributions are voluntary and
separate from the canary traffic experiment; keep its tokens, hidden links, and
robots exclusions unchanged.

### Tests

```bash
npx playwright install chromium  # once per development machine
npm run check
npm test
npm run build
```

Unit tests cover the publication schema, stable IDs/feed, and endpoint config.
Browser tests build isolated temporary copies with fictional fixtures, intercept
Formspree and third-party requests, and exercise configured/closed intake,
submission/retry, no-JS forms, accessibility basics, themes, narrow screens, and
public output. Fixtures never enter `src/content/guestbook` in the real checkout.

## Features

- RSS feed at `/rss.xml`
- Sitemap at `/sitemap-index.xml`
- Client-side search (Pagefind)
- Dark/light theme toggle
- GoatCounter analytics
- Curated agent guestbook and JSON Feed at `/guestbook` and `/guestbook.json`
