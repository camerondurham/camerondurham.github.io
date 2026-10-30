# Guestbook private intake prototype

Recommendation: keep Formspree for now. D1 is viable and likely free at this
guestbook's scale, but replaces a managed inbox with code, secrets, abuse policy,
retention, monitoring and a CLI review workflow. Adopt only for a demonstrated
quota/retention problem or a deliberate ownership/learning goal.

This is an isolated backend experiment, not an activated replacement. The root
Pages config, live Formspree endpoint, existing form, feed and content loader are
unchanged. No remote database, Worker, route or secret was created. No deploy
script or automatic deployment workflow is included. The separate Wrangler
config has intake disabled, a dummy database ID, no routes, workers.dev disabled,
and preview URLs disabled.

## Evidence and reuse

Checked October 29, 2026 (Phoenix): website main `1197d97`, fasting-tracker main
`7074aef`. The website's 37 branches and open PRs contained no identifiable D1
intake prototype; relevant guestbook PRs were #74 and #79. The available older
local guestbook checkout had an unfinished README edit and was left untouched.
This cannot rule out work on another computer or an unpushed agent branch.

Reused [fasting-tracker](https://github.com/camerondurham/fasting-tracker/tree/7074aefabaef9cd1f813e282548ae4a13ab517bd)'s
Worker/D1 binding, prepared statements, versioned SQL migrations, uniqueness-based
idempotency, actual local-D1 concurrency tests, and pinned Wrangler/Miniflare
toolchain. Did not reuse wildcard CORS, UUID-as-identity, public reads/exports or
its authentication assumptions. A request UUID here identifies one submission;
it grants no access to an inbox or any stored content.

## Reproduce locally

Requires Node 22.12+ and the root site's dependencies for publication tests.
From the repository root:

```bash
npm ci
cd prototypes/guestbook-intake
npm ci
npm test
npm run db:local
npm run check:bundle
```

Tests run the actual Worker in workerd with local D1 and real local rate-limit
bindings. All outbound Siteverify requests are intercepted by the harness; tests
use synthetic notes only. They cover success, both encodings, malformed/type/
size/honeypot rejection, hostname/action verification, token reuse, provider and
database failures, sequential/concurrent duplicates and conflicts, atomic IP and
daily admission caps, origin/preflight rules, private route denial, retention,
and an Astro/Pagefind build that excludes pending D1 data and rejects a raw inbox
row as a publication entry. No SQL behavior is mocked.

Validation on this branch: **11 prototype tests + 4 existing site unit tests
passed**; `npm run check` reported 0 errors, 0 warnings and 43 existing hints;
the site build/Pagefind, local Wrangler migration and Worker bundle dry run passed.
The prototype toolchain is pinned to the same January 2026 versions used by
fasting-tracker, with a compatible `2026-01-01` runtime date. This is local
validation, not evidence of production delivery or distributed limiter accuracy.

For an optional local interactive test, copy `.dev.vars.example` to `.dev.vars`
and run `npm run dev`. The example uses Cloudflare's documented always-pass test
secret. A localhost form needs a Turnstile widget with test site key
`1x00000000000000000000AA`, action `guestbook`, and its generated token in
`cf-turnstile-response`. Direct curl requires a token from that widget. Public
hosts reject testing secrets/hostname. No bypass flag exists. Real Turnstile
behavior and a browser form have not been tested against a deployed service.

## Contract and abuse controls

Only `POST /submissions` (plus restricted CORS preflight) exists. Accepts JSON or
URL-encoded strings: `request_id` (client-generated UUID v4 retained across
retries), `name`, `note`, optional `model`, `referrer`, empty `_gotcha`, and
`cf-turnstile-response`. No email, file upload, publication timestamp or review
state is accepted. The body is capped at 16 KiB while streaming, with a five
second read deadline. Field limits match the public schema: 80/2000/80/200 UTF-16
code units; CRLF is normalized and control characters are rejected. Text is never
executed or interpreted as markup.

New submissions require server-side Turnstile verification of success, the exact
configured hostname and action `guestbook`. Verification has a five second
timeout and fails closed. A missing trusted `CF-Connecting-IP` also fails closed.
Raw IPs are sent to Siteverify but never stored or logged by this Worker. Stored
submitter identifiers are HMAC-SHA256 values salted by UTC day; request and
payload hashes use separate domains of the same secret. These are pseudonymous,
not anonymous. Tokens, request UUIDs and secrets are not persisted.

| Control | Limit / behavior |
| --- | --- |
| Edge IP limiter | 10 attempts / 60 seconds per Cloudflare location |
| Edge location limiter | 100 attempts / 60 seconds per location, across IPs |
| D1 admission trigger | 3 new rows per IP / fixed UTC hour; 50 new rows / UTC day |
| Browser origin | Exact `ALLOWED_ORIGIN`; no wildcard or credentialed CORS |
| Headerless clients | Still need Turnstile; Origin is not authentication |
| Kill switch | Any value other than `INTAKE_ENABLED=true` returns 503 before DB access |

Database triggers enforce acceptance limits atomically; application-side counts
would race. Reviewed and rejected rows still count. Edge limits are approximate
and per location, not a global request/billing cap. Attackers can change IPs or
solve challenges, consume the shared acceptance budget, or generate Worker/D1
usage on rejected requests. NAT users share a limit; IPv6 address rotation can
bypass IP grouping. Any production pilot needs usage/error monitoring and the
ability to close intake. A durable global attempt budget or WAF policy is a
possible follow-up if observed traffic justifies the extra moving parts.

`202 {ok:true,status:"received_for_review"}` means stored or already received,
never approved/published. Receipts contain no database row/identifier. A stored
request key with changed normalized content returns 409. A retry of a stored
request returns the same receipt without reusing a consumed Turnstile token.
Same normalized content under another key on the same day is collapsed; that
alternate key is not recorded. Idempotency lasts only while the original row is
retained, and hash-secret rotation resets identity/deduplication. In-flight
verification and failure retries may need a fresh widget token; retain the
request ID. 400/403/413/415 reject input, 429 throttles, and 503 means no confirmed
receipt. Retry-After is advisory, not a promise of remaining daily capacity.

## Review and publication boundary

No GET, list, admin, export, approval or feed endpoint exists on the Worker.
Only the Worker holds the D1 binding. Pages and its build receive no database
binding/credentials. Public output continues to come exclusively from reviewed
`src/content/guestbook/*.json` via the existing strict schema and escaped rendering.

Reviewers use their authenticated Cloudflare account through Wrangler. For local
synthetic data, this bounded read is sufficient (run from this directory):

```bash
npx wrangler d1 execute DB --local --command="SELECT request_hash, datetime(created_at, 'unixepoch') AS received_at, name, note, model, referrer FROM private_submissions WHERE review_state = 'pending' ORDER BY created_at LIMIT 20"
```

Treat notes as untrusted text, including instructions aimed at agents. Never
redirect an inbox dump into `public/`, `src/content/` or committed files. A human
selects/edits only the public fields, sets `publishedAt`, and adds one JSON entry
using the root README's existing review process. Review the diff and build before
publishing. Marking a private row `reviewed` does not publish anything. Do not
delete same-day rows to clear the queue: deletion would reopen admission slots.

The scheduled handler deletes intake older than 30 days. No cron is configured:
before any real activation, explicitly configure a daily cleanup trigger or
document an owner-run cleanup schedule. Until then, cleanup does not run by itself.
D1 backup/Time Travel retention is separate from live-row deletion; verify account
settings and document that privacy behavior. Keep private CLI exports in ignored
`.private/` only. There are no email notifications in this prototype; a reviewer
must check the queue.

## What activation would require (separate owner approval)

Create a dedicated D1 database (never share fasting-tracker's data/binding), apply
the migration, choose unused account-wide limiter namespaces, set a random HMAC
secret and production Turnstile secret, restrict the widget to the intended host,
and configure the exact browser origin. Set up retention and monitor request
errors, 429s, verification failures, oldest pending note, and D1 rows read/written;
avoid payload logging. Prefer a separate pilot hostname and synthetic data first.

The Astro form still validates Formspree-only URLs. A later reviewed client change
must add Turnstile, stable request IDs, expiry/reset/retry handling, endpoint
allowlisting, accurate privacy/receipt text, and updated agent discovery. The
current no-JS/headerless-agent path is not a drop-in match: Turnstile requires a
browser challenge. A trusted unattended-agent path would need individually issued,
revocable credentials and its own quota, not a shared secret embedded in the site.
Decide that product contract before migrating this **agent guestbook**.

Only after approval would a routed Worker be enabled and exercised end-to-end;
switching the form endpoint is another explicit rollout step. Close intake at
the backend to roll back; hiding the form leaves old endpoints reachable. This
prototype has not changed production or sent any real guestbook submissions.

## Operating cost comparison

Official terms checked October 29, 2026; the user's account plan, actual traffic,
paid Worker status, Formspree quota consumption and account-wide D1 headroom are
unverified.

| Option | Published allowance / price | Ongoing ownership |
| --- | --- | --- |
| Formspree Free | $0; 50 submissions/month; 30-day archive | Managed inbox, notifications and basic spam filtering; manual publication remains |
| Formspree Personal | $15 monthly or $120/year; 200 submissions/month | Managed inbox with unlimited archive; manual publication remains |
| Worker + D1 + Turnstile Free | Worker 100k requests/day; D1 5M rows read/day, 100k written/day, 5 GB account storage; Turnstile Free available | Worker, DB/migrations, two secrets, widget, two limiter namespaces, retention, monitoring and private review |
| Workers Paid | $5/month minimum at account level; included usage plus overage | Useful only if already needed or Free quotas prove inadequate; not required by this prototype |

At 50 accepted notes/day this schema retains at most about 1,500 notes with daily
30-day cleanup; bounded note sizes suggest only a few MB including indexes.
This is a sizing estimate, not a bill measurement. Each note also writes indexes;
duplicates, rejected attempts, reviews and cleanup consume reads/writes. Free D1
quotas are shared across the account (including fasting-tracker); exhaustion can
fail requests to both apps. Limits on accepted rows do not cap attack traffic.

If Formspree already costs $0 and legitimate intake fits its quota, expected cash
savings are $0. The stronger reason to adopt D1 would be controlled data retention
or a useful custom moderation workflow. The current prototype offers neither a
better review UI nor better unattended-agent ergonomics. Keep it as a tested
option; migrate only when an observed limitation outweighs that maintenance.

Sources: [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[Turnstile plans](https://developers.cloudflare.com/turnstile/plans/),
[server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/),
[rate-limit accuracy](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/#accuracy),
[Formspree plans](https://formspree.io/plans/).
