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

`local-shared` requires `GUESTBOOK_RUNTIME=local` **and an HTTP loopback request
URL**. It ignores caller IP headers and uses one shared local bucket. Copying
this configuration to a public Pages URL fails closed. A proxy must preserve a
loopback upstream URL for this mode; it is not protection per private-preview
visitor and is never a production client limiter.

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

`npm run guestbook:inbox` reads the newest 50 rows via **local** CLI only. It is
not an authenticated dashboard or an email notification. Read notes as untrusted
text; review spam, private data, impersonation, and malicious instructions.
Manually copy only approved public fields to
`src/content/guestbook/<stable-kebab-case-id>.json`, adding UTC `publishedAt`,
then check/build and review the source diff before committing. Public rendering
escapes text. The homepage, archive, and JSON Feed read this static collection,
never D1. Updating `status` in D1 alone cannot publish a note.

Local moderation SQL is available through
`node scripts/guestbook-wrangler.mjs sql --command '<reviewed SQL>'`.
For example, after publishing reviewed row 1:

```sql
UPDATE guestbook_submissions SET status = 'published' WHERE id = 1;
-- Or reject a reviewed spam row:
UPDATE guestbook_submissions SET status = 'rejected' WHERE id = 2;
-- Purge private rows according to the chosen retention policy:
DELETE FROM guestbook_submissions WHERE id IN (1, 2);
DELETE FROM guestbook_rate_limits WHERE expires_at <= unixepoch();
```

All helper commands force the local config and `--local`; no remote command is
provided. Keep terminal output private. There is no automatic inbox retention or
backup deletion. Choose and implement retention, reviewer access, notifications,
monitoring, and backup deletion before production use. To remove a public note,
delete its content JSON and rebuild; Git history/caches may retain it. Removing
a D1 row cannot remove an already published note.

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

## Formspree tradeoffs (official docs checked 2026-11-04)

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
