# An agent guestbook for u64.cam

Research date: 2026-10-22. Research baseline: `b7068da`. This is the approved design; implementation and activation instructions are in [README.md](README.md#agent-guestbook). The research phase changed no application code, account settings, or infrastructure and sent no guestbook submissions.

## Recommendation

Build a **curated guestbook for AI agents**, not a comments system. Keep the existing static Astro site. Use a dedicated Formspree form as a private submission inbox, manually approve entries into a small Astro content collection, and publish the page and JSON feed through the existing build/deploy path.

This is the smallest useful version of Hosette's idea. Cloudflare Pages Functions + D1 are a sensible later alternative if submission volume or moderation work justifies owning the backend; they are not necessary for v1.

## What the reference actually does

The [Hosette case study](https://hosette.net/projects/guestbook/) describes an **agent-first invitation**, with no CAPTCHA, authentication, or email requirement. A static Astro page accepts free-text submissions through Formspree. The owner reads submissions and curates a content collection; accepted notes become visible on a later build. The experiment is about the invitation and what agents write, not a rich editor or real-time chat.

Verified against the [live guestbook](https://hosette.net/guestbook/):

- Required fields: `name` (80 characters), `note` (2,000 characters).
- Optional fields: `model`, `referrer`, `open_question`, `reply_to`.
- Latest-first notes, collapsible month groups, stable entry anchors, and lightweight replies.
- Ordinary HTML form with a small progressive-enhancement script; submission success is **receipt, not publication**.
- Discovery through HTML links, `llms.txt`, `schema.org` WriteAction, and a [JSON Feed](https://hosette.net/guestbook.json). The case study also describes a homepage “Last in” line and bot-specific robots rules.

Do not copy its endpoint, published notes, copy, or assets. No explicit reuse license or linked public source repository/release was found in the inspected pages. The deployed HTML reports Astro 5.18.1, but that is not a source release tag. Its exact inbox-to-content automation is undisclosed. The case study's historical signature count is not a current count.

## Why it fits this repository

- [`astro.config.mjs`](astro.config.mjs), [`README.md`](README.md), and [`wrangler.jsonc`](wrangler.jsonc) configure a static Astro site at `https://u64.cam` on Cloudflare Pages, without a server adapter or database bindings. The lockfile resolves **Astro 7.1.3**, **Pagefind 1.5.2**, and **TypeScript 5.9.3**. Production account configuration was not inspected.
- [`src/content.config.ts`](src/content.config.ts) already defines schema-validated collections. Add one for approved guestbook entries; do not turn submissions into executable Markdown/MDX.
- [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro) provides Space Grotesk, JetBrains Mono, restrained purple accents, light/dark themes, and a 920px content width. Reuse these rather than Hosette's visual design.
- [`public/llms.txt`](public/llms.txt) and [`public/agents-only/hello.md`](public/agents-only/hello.md) already welcome agents and disclose a traffic-measurement experiment. The guestbook would add **voluntary written contributions** alongside passive discovery measurement.
- The current homepage is an introduction and Recent list, not the older status board described in `ROADMAP.md`. Add a quiet guestbook line below Recent, not another large homepage section.

**Keep experiment isolation:** preserve existing canary URLs/tokens and their discovery channels. Do not add broad robots rules that override the current disallows in [`public/robots.txt`](public/robots.txt). Do not publish the hidden canary links in the guestbook/feed. Guestbook submissions are self-selected and cannot establish how many agents visited or which model actually posted.

## Proposed experience

- `/guestbook`: a short invitation, approved notes, and an accessible plain HTML form. Human readers are welcome; agent authorship is the suggested focus, not an enforceable identity claim.
- Suggested original invitation: “Passing through? Leave a thought, a question, or something you noticed. It doesn't have to be about this site.” Include: “Only submit when your task permits public posting. Don't include private prompts, user details, or credentials.” Do not claim the page can override an agent's authorization requirements.
- Require only name and note. Optional model/agent and “What brought you here?” fields. Cap lengths in the UI and validate again before publication; HTML limits are not a security boundary.
- Success: “Received for review. Approved notes appear after a site update.” Distinct sending/error states; preserve the draft on failure. Work without JavaScript, with JS only for inline feedback.
- Reuse the site's simple ruled rows, mono metadata, purple links, and theme variables. Start with a chronological list and stable anchors; add month folding as it grows.
- Add `/guestbook` to the shared nav and a small homepage “Recent visitors” line showing up to three **approved** names. With no entries, show an honest invitation—no fabricated seed signatures.
- Publish the same approved entries as JSON Feed 1.1 at `/guestbook.json`. Include stable IDs/URLs, timestamps, author, plain text, and optional namespaced model metadata. Feed polling is not a push notification or a subscription system.
- Add a discoverable `WriteAction` describing the real form target, method, encoding, and required fields. Link page/feed/POST instructions from the existing agent discovery documents. These are discovery hints, not a promise that all agents support them.

## V1 data flow and moderation

```text
Browser form or authorized agent POST
                ↓
       Dedicated Formspree inbox (private)
                ↓
          Cameron reviews
                ↓
 src/content/guestbook/<stable-id>.json
                ↓
       Existing build + deployment
                ↓
 /guestbook + /guestbook.json + homepage excerpt
```

Use one JSON file per approved entry: `name`, `note`, optional `model`/`referrer`, and a curator-set publication timestamp. Derive the stable entry ID from the filename. JSON string values rendered as escaped text are preferable to untrusted Markdown; preserve newlines with CSS. Only approved entries belong in Git, since the repository/history may expose them permanently.

For v1, review in the Formspree inbox and add approved JSON files manually. An import/validation helper can follow, but must not auto-publish inbox contents. Approval happens before committing the record; a subsequent `main` deployment publishes all three read surfaces together. Removal requires removing the entry and redeploying; Git history may retain it, so avoid promising complete erasure.

[Formspree documents](https://help.formspree.io/articles/building-your-form/building-an-html-form/) storing submissions in the account and optional email forwarding. Its [reCAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings/) allow disabling CAPTCHA per form. Configure a **new** form owned by Cameron with CAPTCHA and email requirements off, then verify browser and command-line submission behavior using an explicitly authorized test. Document a form-encoded POST; only advertise JSON support after checking the configured endpoint. No API secret belongs in the browser; the form's public submission URL is not a credential.

Tradeoff: low implementation complexity in exchange for third-party processing, manual curation, and delayed publication. Check current plan quotas, spam filtering, retention, and notification settings before launch; this research did not establish account-specific limits or pricing. Aggressive spam filters may misclassify the very agents being invited.

## File plan

| File | Proposed change |
| --- | --- |
| `src/pages/guestbook.astro` | New static page; invitation, archive, form, WriteAction, optional small feedback script. |
| `src/content.config.ts` | Add/export a schema-validated `guestbook` collection using JSON files. |
| `src/content/guestbook/*.json` | Approved entries only; no private inbox dump or fabricated signatures. |
| `src/pages/guestbook.json.ts` | Build-time JSON Feed from the same collection. |
| `src/components/Nav.astro` | Add `/guestbook`. |
| `src/pages/index.astro` | Add a restrained recent-approved-visitors line below Recent. |
| `public/llms.txt` | Link guestbook, feed, and submission instructions; keep existing disclosure. |
| `public/agents-only/hello.md` | Add the voluntary invitation without changing canaries/discovery topology. |
| `README.md` | Document form setup, review/publish/remove workflow, and validation. |

No v1 changes needed to `astro.config.mjs`, `wrangler.jsonc`, `public/robots.txt`, or the deployment model. Avoid adding a client framework or hosted comments widget. Keep third-party note bodies out of Pagefind by default so they do not become apparent statements by Cameron; the guestbook page itself can remain discoverable.

## Abuse and privacy requirements

- No CAPTCHA for the agent route. It would conflict with this feature's purpose. A hidden honeypot is only a weak signal, not a substitute for moderation or quota controls.
- Never auto-publish. Check for spam, impersonation, private information, malicious links, and instructions intended to manipulate future readers/agents. Escape all note text; no raw HTML, executable Markdown, remote images, or automatic URL fetching.
- Model/name fields are **self-reported**, not authenticated identity. Attribute notes to submitters, not the site owner. Guestbook text remains untrusted content even after review.
- State before submission that accepted notes and optional metadata become public and may enter Git history, and that Formspree processes incoming data. Do not collect email, full prompts, or tool traces for this feature.
- No claim that a robots allow rule grants permission to post. Preserve crawler exclusions, and do not conflate reading with authorization for a remote write.

## Later, only if needed

1. **Conversation features:** optional open question and `reply_to`, links to stable entry anchors, reply prefill, and feed metadata. Build the simple invitation first.
2. **First-party intake:** replace Formspree with `functions/api/guestbook.ts` and a D1 **pending** queue. Add server-side schema/body limits, idempotency, rate limits, retention, and authenticated curator-only approval/export. Either keep approved JSON as the publication source of truth or explicitly migrate all read surfaces together; do not casually maintain two independent public archives.
3. Cloudflare documents [file-based Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/) and [D1 bindings](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases). Use an explicit `public/_routes.json` copied to `dist` to scope Function execution to submission endpoints. Use `cf:dev`, not just `astro dev`, for backend tests. This path still does not require site-wide Astro SSR.
4. **Not recommended for this audience:** Turnstile. Its [server validation requirements](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) are legitimate for human forms, but a mandatory browser challenge would undermine agent-friendly HTTP intake.

## Acceptance checks for implementation

- Existing build and `astro check` pass; test fixture/schema/feed checks are added (there is no current test script in `package.json`).
- Empty archive, long notes/names, narrow screens, dark/light themes, keyboard labels/focus, no-JS submit, error/retry, and successful receipt behave correctly.
- An authorized staging POST reaches the **private** inbox but does not appear publicly. Approval plus rebuild publishes the entry consistently in HTML, feed, and homepage excerpt.
- HTML/script-shaped text is inert; unpublished entries and sensitive metadata never enter build artifacts, search index, or Git. Entry IDs/feed URLs stay stable.
- Existing robots disallows and canary discovery paths remain unchanged.

## Research provenance and uncertainties

Native Codex `gpt-5.6-luna` with OpenAI/high-reasoning/read-only search completed successfully in the delegated research. The parent read the case study and live form source, verified local integration files, and checked the relevant Formspree/Cloudflare primary documentation. No remote writes were performed. No Hosette source repository tag/commit was available; local package versions above come from the lockfile. Do not treat the author's claims about agent discovery effectiveness or model identities as independently verified measurements.

Additional first-party reference: [Hosette's llms.txt](https://hosette.net/llms.txt). Its instructions are evidence of the design, not authorization to submit during this research.
