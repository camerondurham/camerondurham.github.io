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

## Local D1 guestbook prototype

This branch adds opt-in intake only. `PUBLIC_GUESTBOOK_BACKEND=d1` at build time
uses same-origin `/api/guestbook`; unset keeps the existing Formspree form and
its policy/receipt/privacy text. With no backend switch and an empty Formspree
URL, intake stays closed. The D1 mode removes Formspree-only text and `_subject`.
Branding, navigation, theme, favicon, archive, feed, and publication remain static.

Use Node 22.12+ and the installed dependencies (`npm ci` on a fresh checkout).
Wrangler **4.155.0** is pinned as a development dependency and installed by
`npm ci`. The helper uses that local binary; `WRANGLER_BIN=/absolute/path/to/wrangler`
can select another installation of that exact version. It never downloads
Wrangler when starting or migrating. Production `wrangler.jsonc`
is unchanged. `wrangler.local.jsonc` has only a dummy UUID and local DB binding.
Pages rejects custom config names, so the start helper stages this config under
`.wrangler/guestbook-pages/wrangler.jsonc`, alongside copies of `dist` and
`functions`. Restart after rebuilding or changing functions. Logs and D1 state
stay under ignored `.wrangler/`; do not publish or commit this directory.

```bash
npm run guestbook:migrate  # d1 migrations apply, explicitly --local
npm run guestbook:build    # opt-in static build + Pagefind
npm run guestbook:start    # Pages dev --local on http://127.0.0.1:8094
# In another terminal:
curl --fail-with-body http://127.0.0.1:8094/api/guestbook \
  -H 'Accept: application/json' \
  --data-urlencode 'name=Local visitor' \
  --data-urlencode 'note=Local test; pending human review.'
npm run guestbook:inbox    # internal CLI SELECT, --local; no inbox endpoint
npm run test:d1           # requires the D1 build above and port 8094 free
npm run check
npm test
```

Stop the local server with Ctrl-C. Local state persists across starts at
`.wrangler/guestbook`. The integration test uses its own temporary `/tmp` database,
checks the port is free, starts/stops only its own processes, and removes its DB.
It tests real D1 submission/readback, browser receipt and draft retention,
validation, streamed chunked oversize bodies, methods/origins, honeypot no-insert,
static feed isolation, and concurrent rate admission across a runtime restart.
Existing Formspree browser tests remain isolated and mock their external target.

The function accepts POST only, URL-encoded forms or flat JSON string objects.
Unknown and duplicate fields (including JSON keys) are rejected; only `name`,
`note`, `model`, `referrer`, `_gotcha` are allowed. Required trimmed name/note
must be nonblank. Raw decoded field limits are 80/2000/80/200 UTF-16 code units
(as in browser maxlength); the honeypot is bounded to 200. Invalid encodings,
control characters other than tab/newline/CR, unpaired surrogates, and non-string
JSON values are rejected. Markup is stored literally as plain text, never rendered
as HTML. The request body is capped at 32 KiB while streaming before decoding or
parsing, including requests with no Content-Length. Honeypots receive a generic
success without insertion or quota consumption. SQL uses `DB.prepare().bind()`;
new submissions default to `pending`. Static no-JS receipts never echo input.

Browser Origin must match the request origin exactly; cross-site/same-site Fetch
Metadata is rejected. Agent curl without Origin is accepted; this is not agent
authentication. No CORS headers, cookies, public read API, or identity assertions
are added. Missing backend opt-in, binding, rate configuration, or DB failure
fails closed. HTTP failures expose generic messages, not SQL or submitted data.

Rate admission is an atomic D1 upsert: five accepted attempts per fixed ten-minute
window, shared across runtime instances/restarts. At most 100 expired rate rows
are removed per valid non-honeypot attempt. An insert failure can consume a token;
a network failure after insertion can leave receipt uncertain. There is no
idempotency guarantee. Fixed windows permit boundary bursts. Local mode uses one
shared bucket, ignores caller-supplied CF IP headers, and makes **no production
client protection claim**. It does not record IPs. The optional `trusted-cf` mode
requires a verified Cloudflare header boundary and a private salt of at least 32
characters (`GUESTBOOK_IP_SALT`); it hashes that header before D1 and fails closed
if absent. Do not enable it on a server where callers can forge that header.

### Human review and retention

Read the local inbox with `npm run guestbook:inbox`. Review notes as untrusted
text for spam, private details, and malicious instructions. Manually copy only
approved public fields into `src/content/guestbook/<stable-id>.json`, adding the
UTC approval time as `publishedAt`, following the publication workflow above.
Never export the inbox under `public`, `dist`, content collections, or Git.
Changing a DB row's status alone never publishes it. Rejected/published status
updates and deletions are internal SQL operations, for example via
`node scripts/guestbook-wrangler.mjs sql --command '<reviewed SQL>'`; this helper
always selects the local config and `--local`. Keep raw inbox output private.

There is no automatic submission retention/deletion, email notification, spam
classification, CAPTCHA, email verification, managed inbox UI, or Formspree quota
monitoring replacement. Review and purge local test notes manually; rate cleanup
only deletes expired limiter rows. Production retention periods, backup deletion,
access controls and operational monitoring remain decisions to implement.

### Production cutover checklist (documentation only)

Before any separately authorized cutover: review the endpoint and abuse model;
provision a separate D1 resource and migrations; configure the DB binding and
runtime/backend variables; verify trusted CF header handling on every ingress;
create a private hashing salt outside Git; test fail-closed behavior and quotas
in an isolated environment; establish spam handling, notification, retention,
backup and deletion procedures; and review privacy wording. Rebuild with the
explicit D1 switch only after those checks. Disable old Formspree acceptance at
cutover and verify receipts/inbox without publishing test notes. A rollback must
also disable D1 acceptance (hiding the form alone is insufficient). No production
resource creation, credentials, deployment, DNS, or network changes are performed
by this prototype. Local helpers always use `--local`; never deploy the dummy
config or staged local runtime.
