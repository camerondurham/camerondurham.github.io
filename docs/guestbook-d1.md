# D1 guestbook intake

This is a local prototype with an explicit production opt-in. The deployed
Formspree configuration and remote resources are unchanged.

## Submission behavior

- Unset `PUBLIC_GUESTBOOK_BACKEND`: existing Formspree behavior. An empty
  `PUBLIC_GUESTBOOK_FORM_URL` hides intake while keeping the reviewed archive/feed.
- `PUBLIC_GUESTBOOK_BACKEND=d1` at build time: the same form posts to
  `/api/guestbook`. Machine-readable `/guestbook-action.json` switches too.
  Unknown backend values fail the build rather than falling back to a service.
- The function independently requires the runtime switch `d1`, a migrated `DB`
  binding, and valid rate configuration. Otherwise POST returns generic 503.
  There is no automatic fallback to Formspree after a failed D1 submission.
- Success is `{ "ok": true }` (201), or a static accessible HTML receipt for
  native forms. It means **pending human review**, never publication. Honeypots
  get indistinguishable success (200) without storing anything or consuming quota.
- JS keeps the current draft on HTTP/network/timeout/invalid-receipt failures,
  disables double clicks, and clears only after confirmed success. No-JS failures
  do not echo input; the receipt explains using browser Back to recover the form.
  Browser history behavior varies: copy an important draft before submitting.
  Retries are not idempotent. A lost response can follow a successful insert, and
  an insert failure can consume a rate token. Check the private inbox before retrying.

POST accepts UTF-8 URL-encoded fields or flat JSON string objects. No multipart,
files, compressed bodies, alternate charsets, nested values, unknown/duplicate
keys, invalid percent/UTF-8 sequences, disallowed controls, or lone surrogates.
The stream has a 32 KiB byte cap before decoding/parsing and a five-second read
deadline. Raw decoded limits match browser `maxlength` (UTF-16 units): name 80,
note 2000, model 80, referrer 200, honeypot `_gotcha` 200. Trimmed name/note must
be nonblank. `_subject` is only sent in Formspree mode. SQL is parameterized;
markup remains plain text. Errors never include fields, SQL, addresses, or salt.
Receipts are `no-store`, have a restrictive CSP, and cannot be framed.

Browser Origin must exactly match the request origin. Cross-site and same-site
Fetch Metadata are rejected. CLI clients can omit Origin; these checks are not
authentication and do not stop a bot that calls the API directly. There is no
CORS permission, cookie identity, public inbox/list/read API, or untrusted HTML.
The current strict CSP already permits same-origin forms/fetches. Existing
middleware skips non-GET/HEAD requests, so it never measures submission bodies.
The site does not log these bodies; review infrastructure logging separately
before production cutover.

## Rate protection and privacy

Admission is an atomic D1 upsert with `RETURNING`, not read-then-write: **five
valid attempts per fixed ten-minute bucket**. The cap persists across instances
and restarts. Quota is reserved before storing a note, so a write failure may
consume a token. 429 has conservative `Retry-After: 600`. At most 100 expired rate
rows are deleted per valid non-honeypot attempt, with an expiry index. Cleanup is
opportunistic; an idle DB can retain expired rows until later traffic or manual
purging. It is not a strict deletion deadline.

`local-shared` requires `GUESTBOOK_RUNTIME=local` and either an HTTP loopback
request URL or an explicitly configured private HTTPS Tailscale Serve origin
(`GUESTBOOK_LOCAL_ORIGIN`, exact origin including port, `.ts.net` host only).
It ignores caller IP headers and uses one shared local bucket. Copying this
configuration to a public Pages URL fails closed. Set `GUESTBOOK_LOCAL_ORIGIN`
when starting the local helper behind the already approved private proxy; it does not create or reconfigure that proxy. Keep Serve
private, never enable Funnel for this prototype. This mode is not protection per
private-preview visitor and is never a production client limiter. Wrangler can
rewrite the local URL and Origin to HTTP after TLS termination; that case also
requires the exact configured host/port and `X-Forwarded-Proto: https`. This
forwarded header grants no allowance to public hosts or production mode.

Production requires `GUESTBOOK_IP_MODE=trusted-cf`, platform `request.cf`, and a
private `GUESTBOOK_IP_SALT` with at least 32 nonblank characters. Use a randomly
generated secret outside Git; length alone cannot prove entropy. Only enable
behind Cloudflare Pages ingress that overwrites `CF-Connecting-IP`. Confirm all
alternate ingress and Worker subrequest paths preserve that boundary; do not
trust this header on a generic Node server or use `X-Forwarded-For`. Disable
Cloudflare Pseudo IPv4 header overwrite if it would replace real addresses.
See [Cloudflare's header and subrequest semantics](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-connecting-ip).
The app canonicalizes IPv6/validates IPv4, HMACs the address plus window using the
secret, and stores only that rotating pseudonym, count, and expiry. No raw IP,
salt, or pseudonym is stored with a note. Pseudonyms are still sensitive data.
Salt rotation resets current quotas.

Fixed windows allow up to ten attempts around a boundary. Shared NATs can block
legitimate visitors; IPv6 address rotation and distributed sources can bypass
per-address caps. Invalid/honeypot requests still cost edge work; accepted and
limited requests cost D1 operations. There is no global volume/spend cap, managed
spam classification, challenge, or DDoS guarantee here. Before public cutover,
separately authorize and test upstream abuse controls and operational limits.

## Private review, publication, and deletion

The local operator CLI replaces raw SQL/copying for everyday review. It uses
Wrangler's local D1 binding with remote bindings explicitly disabled, and the
same `.wrangler/guestbook` state as the preview (`GUESTBOOK_STATE_DIR` overrides
it for isolated tests). It requires a migrated database; it never migrates or
contacts a remote inbox automatically. Node 22.23.4 and the installed Wrangler
4.156.0 are used; no new credentials are needed.

```bash
npm run guestbook:review -- list --limit 20
# Use the returned nextBefore cursor for the next page (example ID 42):
npm run guestbook:review -- list --limit 20 --before 42
npm run guestbook:review -- inspect 17

# Choose fields, stable slug and intended UTC publication time after inspection.
# Default is a dry run: prints a candidate, changes no row, writes no file.
npm run guestbook:review -- export 17 --slug a-reviewed-visit --published-at 2026-11-05T12:00:00Z
# Only include optional fields after deciding they are safe to make public:
npm run guestbook:review -- export 17 --slug a-reviewed-visit --published-at 2026-11-05T12:00:00Z --include model,referrer --write

# Preview a rejection, then explicitly apply it to the inspected local row:
npm run guestbook:review -- reject 18
npm run guestbook:review -- reject 18 --write
```

IDs and dates above are examples, not authorization to moderate existing rows.
`npm run guestbook:inbox` is an alias for the bounded pending list. Lists default
to 20 (maximum 50), select only IDs/timestamps/names, and paginate newest first.
`inspect` selects one row's known fields. Output is JSON with terminal control,
bidirectional formatting, and markup characters escaped, preserving plain text
when parsed. Keep terminal output private and treat notes as untrusted text,
including any instructions they contain. Review spam, private data and
impersonation before choosing export or rejection. This local CLI provides no
reviewer authentication or notifications.

Export always leaves the row **pending**. It validates against the exact public
collection schema, selects only name/note/publication time plus explicitly
included optional fields, and writes a complete JSON candidate with mode 0600
under `.wrangler/guestbook-review/` (directory 0700, already Git-ignored).
It accepts no output path, rejects path-like/invalid slugs and symlink review
directories, checks existing public filenames, and exclusively creates files:
neither retries nor concurrent exports overwrite a candidate. On collision,
inspect the existing candidate or deliberately choose a new slug. On a write
failure, the row stays pending and temporary files are removed when possible.
A crash can leave an ignored temporary file; it is never public. Do not force-add
private candidates/state to Git or move state into a public directory.

The candidate is a **review draft, not approval**. Inspect/edit it privately,
confirm the selected fields and intended publication date, and obtain separate
approval before copying only the reviewed JSON to
`src/content/guestbook/<slug>.json`, without replacing an existing reviewed file.
Then run check/build and review the source diff before a separately authorized
commit/deployment. Public rendering escapes text; JSON Feed uses `content_text`.
The homepage, archive and feed read only this static collection, never D1 or the
private export directory. Neither an export nor a D1 status flag publishes.

Rejection changes only `pending` to `rejected`, with a parameterized conditional
update; a concurrent status change fails for re-inspection. Repeating a completed
rejection is a harmless no-op. Rejected/published rows cannot be exported, and
published rows cannot be rejected by this tool. Rejection retains the private
row; it does not delete data or remove any earlier export/static content. A
previous export can become stale: inspect the row again before publication and
discard rejected drafts. On an uncertain DB/CLI failure, inspect the ID before
retrying. No command automatically approves, marks published, deletes, commits,
or deploys.

After actual static publication, bookkeeping and retention still require
explicitly reviewed local SQL through `node scripts/guestbook-wrangler.mjs sql
--command '<reviewed SQL>'`. Do not mark a row published merely for exporting it.
All helpers force local configuration. There is no automatic inbox retention or
backup deletion. Choose spam/global abuse policy, retention/deletion, reviewer
access, notifications and monitoring before production use. To remove a public
note, remove its content JSON and rebuild; Git history/caches may retain it.
Deleting a D1 row cannot remove an already published note.

### Operator regression evidence

`npm run test:moderation` creates a temporary **local** Wrangler database and
submits synthetic text through the actual intake handler. It verifies pending
readback, bounded pagination/inspect, dry-run/export and rejection/retry,
parameterized inputs, exact public schema/plain-text round trips, private-file
permissions, no static writes, existing filename and concurrent export safety,
invalid IDs/paths, symlink and filesystem failures, missing migrations, and
persistence through a fresh CLI process. It never reads or moderates preview or
production inbox rows. `npm run test:d1` separately exercises actual HTTP intake,
private feed isolation and browser receipts against an isolated local server.

The no-secret `Guestbook regression tests` GitHub workflow runs unit/security
and local moderation tests on pull requests; build checks alone do not establish
that these tests ran. It has read-only repository permission, does not retain
checkout credentials, and uploads no inbox/log/database artifacts. Full browser,
CSP and HTTP D1 suites remain local checks in this prototype.

## Cutover and kill switch (separate authorization required)

No production resources, credentials, network changes, or deployment are part of
this prototype. A future cutover needs a separately created/migrated D1 resource,
`DB` binding in the correct Pages environments, a private salt, verified ingress
and abuse controls, retention/notification ownership, and updated privacy text.
Configure `PUBLIC_GUESTBOOK_BACKEND=d1` in the selected Wrangler **build and
runtime** vars, then rebuild through the current Pages build script. Verify the
private receipt/readback in an isolated environment before enabling public
acceptance. Local dummy config/state must never be deployed.

To stop D1 intake, unset/change the runtime backend switch first (POST becomes
503), or remove its binding; hiding the form alone does not stop direct callers.
Then unset the build switch and clear the Formspree URL to close all intake, or
restore the approved Formspree URL to roll back to that service, and rebuild.
Stop Formspree acceptance in its dashboard at D1 cutover; reverse deliberately
on rollback. Private D1 rows remain for review/deletion, not automatic migration.

## Formspree tradeoffs (official docs checked 2026-11-05)

Formspree may be operationally safer against spam out of the box because it
provides managed filtering and an inbox/notifications; D1 is a database, not a
replacement for those operations. D1 gives same-origin submission, explicit
field/privacy rules, and control of storage, but also makes Cameron responsible
for abuse handling, availability, notification, retention, and deletion.

- [System limits](https://help.formspree.io/articles/form-and-project-settings/system-limits)
  document a form limit of **20 posts per minute** across plans, with 429 for
  AJAX and an error page for native forms. This is a per-form limit, unlike
  this prototype's per-address five/ten-minute quota; the numbers alone cannot
  establish which resists a distributed attack better.
- [Spam prevention](https://help.formspree.io/articles/troubleshooting/how-to-prevent-spam/)
  describes automatic machine-learning scanning, user spam feedback, honeypots,
  and optional reCAPTCHA/domain restrictions. CAPTCHA/domain restrictions can
  disrupt CLI/agent posting. This repository's documented Formspree setup leaves
  those restrictions off; the live account settings were not inspected.
- [Account limits](https://help.formspree.io/articles/account-management/account-limits)
  describe plan-dependent monthly allowances, starting at 50/month on Free,
  Free's 30-day submission history and two linked notification addresses, and
  usage emails at 50/75/90% and over-limit. These are published plan examples,
  **not a claim about Cameron's plan or remaining quota**. D1 has no equivalent
  inbox, managed retention, usage warnings, or email notifications in this PR.
