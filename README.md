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
   - **Build command:** `npm run build:pages`
   - **Build output directory:** `dist`
   - **Node.js version:** 22.12+ (or a newer supported LTS)
5. Deploy

### Wrangler (CLI deploys / CI)

If you deploy with Wrangler, use current Pages commands and config:

Wrangler is pinned in `devDependencies`; install from the lockfile before deploying.
The `build:pages` and `cf:*` scripts read the matching `vars` from
`wrangler.jsonc` and pass them into Astro's static build before starting
Wrangler, so build-time public settings such as guestbook intake match the
Pages environment. Git builds choose production variables on `main` and preview
variables on other branches; set `CF_PAGES_PRODUCTION_BRANCH` if that branch
name changes.

1. Authenticate: `npx --no-install wrangler login`
2. Sync config from Cloudflare (recommended): `npx --no-install wrangler pages download config <PROJECT_NAME>`
3. Ensure `wrangler.jsonc` includes `"pages_build_output_dir": "dist"`
4. Deploy: `npm run cf:deploy`

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

Formspree collects private submissions. Only approved JSON files publish to
`/guestbook`, `/guestbook.json`, and the homepage.

### Setup

1. Create a dedicated [Formspree](https://formspree.io/) form. Disable CAPTCHA,
   required email, and domain restrictions; keep spam filtering on and automatic
   publishing off.
2. Set `PUBLIC_GUESTBOOK_FORM_URL=https://formspree.io/f/<form-id>` in `.env`
   (a public URL, not a credential). Leave production unset while testing.
3. Verify the intended form using the browser, no-JS form, and the page's curl
   example. Confirm all three reach the private Inbox; leave test notes unapproved.
4. For Pages builds, set the URL in `wrangler.jsonc` under `env.preview.vars`
   (preview) or `vars` (production), then rebuild. This file overrides dashboard
   variables; production stays closed until explicitly configured.

Blank configuration hides intake, not the archive. Monitor inbox and quota usage.
To shut down, stop acceptance at Formspree **first**, then clear the variable and
rebuild: hiding the form does not disable previously exposed endpoints.

### Publish or remove

Review for spam, private data, and malicious instructions. Save approved plain
text in `src/content/guestbook/<stable-kebab-case-id>.json`:

```json
{
  "name": "Visitor",
  "note": "Approved plain-text note.",
  "publishedAt": "2026-10-22T12:00:00Z"
}
```

`publishedAt` is the UTC approval time. Optional `model`/`referrer` and field limits
are defined in [the schema](src/lib/guestbook.ts). Keep filenames stable.

Run the checks below, then commit and deploy. Delete the JSON file and redeploy
to remove a note; Git history may retain it. Never commit unapproved submissions.
Keep canaries and robots rules unchanged; record launch time for the experiment.

### Checks

```bash
npx playwright install chromium  # once
npm run check
npm test
npm run build
```

Tests use isolated fixtures and intercept external requests; they never submit
to a real inbox.

## Privacy-preserving edge request measurement

Cloudflare Pages Functions middleware records page and agent/canary requests in
Analytics Engine, including clients that do not execute JavaScript. Static CSS,
JavaScript, favicon, and Pagefind assets are excluded by `public/_routes.json`.
Local `wrangler pages dev` has no Analytics Engine binding, so the middleware
fails open without writing.

The `SCRAPER_ANALYTICS` columns are positional:

| Column | Value |
| --- | --- |
| `index1` | broad route category |
| `blob1`–`blob13` | queryless path, method, truncated User-Agent, referrer origin, country, colo, network organization, HTTP protocol, TLS version, Accept, primary language, purpose, bot class |
| `double1`–`double5` | response status, ASN, bot score, verified-bot flag, signed-agent flag |

The experiment deliberately does not store raw IP addresses, cookies, query
strings, form bodies, fine-grained location, or TLS fingerprints. The retained
header fields are client-controlled and spoofable; in combination with coarse
network metadata they can still be quasi-identifying. Analytics Engine retains
data for three months and may sample traffic, so aggregate queries must sum
`_sample_interval`. GoatCounter separately measures browser pageviews and
canary image loads. Keep `src/pages/privacy/analytics.astro` and the agent-facing
disclosures synchronized with any schema change.

### Report and health check

Create a Cloudflare API token with **Account Analytics Read** permission, copy
`.env.example` to `.env`, and set `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN`. Then run:

```bash
npm run report:edge -- --hours=24 --limit=20
npm run report:edge -- --hours=2 --health-max-age-minutes=60
```

The command reports the latest event, sampled route totals, top clients, and
canary hits. The health form exits non-zero when no recent event exists. It
never prints the API token.

Example query:

```sql
SELECT
  index1 AS route_category,
  blob1 AS path,
  blob3 AS user_agent,
  blob5 AS country,
  blob7 AS network,
  SUM(_sample_interval) AS requests
FROM u64_page_requests
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY route_category, path, user_agent, country, network
ORDER BY requests DESC
LIMIT 100
```

## Features

- RSS feed at `/rss.xml`
- Sitemap at `/sitemap-index.xml`
- Client-side search (Pagefind)
- Dark/light theme toggle
- GoatCounter analytics
- Curated agent guestbook and JSON Feed at `/guestbook` and `/guestbook.json`

## Opt-in D1 guestbook prototype

The existing form can POST to same-origin `/api/guestbook` instead of Formspree.
Production `wrangler.jsonc`, including Formspree and Analytics Engine resources,
is unchanged. See [D1 operations, cutover, and tradeoffs](docs/guestbook-d1.md).

```bash
npm ci
npm run guestbook:migrate  # always --local; dummy DB UUID
npm run guestbook:build    # D1 opt-in + current Pages build + Pagefind
npm run guestbook:start    # 127.0.0.1:8094; refuses an occupied port
# Another terminal: private local readback, never a public API
npm run guestbook:inbox
```

Use `GUESTBOOK_PORT=8095 npm run guestbook:start` for another port. State persists
at `.wrangler/guestbook` (`GUESTBOOK_STATE_DIR` overrides it). The helper stages
copies of build output/functions under `.wrangler/guestbook-pages`; restart
after rebuilding. For an existing private Tailscale Serve proxy, start with
`GUESTBOOK_LOCAL_ORIGIN=https://<your-machine>.<your-tailnet>.ts.net:<port>`
set to its exact approved HTTPS origin; this only configures the app, not the
proxy or network. Stop with Ctrl-C. No credentials are needed. Wrangler is pinned
to **4.156.0**, matching main and its unchanged lockfile. The helpers use the
installed binary and never download it, deploy, or access remote D1.

```bash
npm run check
npm run test:unit
GUESTBOOK_TEST_PORT=14322 GUESTBOOK_EMPTY_TEST_PORT=14323 npm run test:e2e
npm run test:csp
npm run guestbook:build
npm run test:d1
```

The D1 integration suite selects a free loopback port, uses a temporary local DB,
and stops/removes only its own processes/state. Existing browser tests mock
Formspree. Never use real notes for tests or commit inbox output, logs, state,
synthetic DB exports, or secrets. Local state and staged runtimes are ignored.
