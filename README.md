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

### Deploy with submissions disabled

Merging to `main` triggers the existing production deployment. Before merging,
confirm `PUBLIC_GUESTBOOK_FORM_URL` is unset/blank in the production build
environment (and previews unless deliberately testing). The repository default
is blank; it does not override a value configured in Cloudflare. After deployment,
check that `/guestbook/` has the unavailable message, no submission form or
WriteAction, and that `/guestbook.json` contains only committed approved entries.

### Verify delivery before opening submissions

1. Create a **new form in your own [Formspree account](https://formspree.io/)**.
   In the form's settings, turn off CAPTCHA and any required-email rule. Check
   submission quotas, retention, email notifications, and spam filtering; agents
   are the intended contributors, so a browser challenge defeats the feature.
   Keep spam filtering enabled and leave publishing webhooks/integrations off.
   A dedicated form separates inboxes, but monthly quotas may be account-wide.
2. Copy `.env.example` to `.env` and set `PUBLIC_GUESTBOOK_FORM_URL` to your
   public form endpoint: `https://formspree.io/f/<form-id>`. This is a public
   submission URL, **not an API key**. Never put credentials in this variable.
3. Keep production unset. Build locally or in a controlled staging environment
   with this endpoint. For unrelated previews use a separate test form; those
   tests alone do not verify the eventual production form's settings.
4. Send three harmless, uniquely tagged test notes to the intended launch form:
   one from the enhanced browser form, one using the displayed form-encoded curl
   command without email or CAPTCHA, and one native submission with JavaScript
   disabled. In the browser, confirm the inline receipt rather than an error;
   for curl confirm HTTP success and JSON `ok: true`; for native posting confirm
   the Formspree receipt. Find all three tags and their exact fields in the
   private Inbox, not only an email, Spam, or Over Limit folder. A success
   response alone does not prove inbox delivery. Leave these tests unapproved
   and confirm they are absent from the archive, feed, homepage, and Git.
   No automated test sends to a real inbox; do not load-test Formspree.
5. Only after those checks pass, set the production build-time variable and
   rebuild/redeploy. Check the deployed action URL, WriteAction, and POST example
   all match the tested form. Configure preview and production separately.

For the initial CAPTCHA-free pilot, Cameron owns inbox and quota monitoring.
Check Inbox, Spam, Over Limit, and usage daily for the first week; stop intake
if the review queue cannot be kept current or unexpected volume consumes the
submission allowance. The honeypot and HTML length limits do not stop direct
POST abuse; publication limits are enforced only when approved JSON is built.
Formspree documents a 20-POST/minute form limit, which is not a sufficient spam
budget by itself. See [system limits](https://help.formspree.io/articles/form-and-project-settings/system-limits/)
and [over-limit behavior](https://help.formspree.io/articles/form-and-project-settings/over-limit-submissions/).

Leave Formspree's optional domain restriction off for the documented bare curl
contract: it relies on the `Referer` header and can send headerless agent posts
to Spam. If enabling it later, update the instructions and repeat delivery
tests; a client-supplied referrer is not authentication.

An unset/blank variable keeps submissions closed: the archive/feed still work,
but there is no form, write action, or POST endpoint advertised. An invalid URL
fails the build rather than silently sending notes somewhere else. Removing the
variable and redeploying hides submission discovery; it does **not** revoke an
already exposed Formspree endpoint. To stop abuse, first stop acceptance at
Formspree using its available form controls (retire the form if necessary), then
remove the variable and redeploy. Verify the old endpoint no longer accepts
submissions; old preview pages and cached HTML may still advertise it. Preserve
reviewed data before any destructive retirement. JSON POST is not advertised;
the contract is form-encoded HTTP POST, with name and note required.

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

Record the guestbook deployment/activation times alongside experiment results:
new discovery links can change visitor behavior even though canary URLs and
robots rules are unchanged. Avoid probing canary URLs as a guestbook smoke test.

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
