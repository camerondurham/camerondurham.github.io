# D1 guestbook

The existing form posts to `/api/guestbook`. Notes are plain text, stored as
`pending`, and never read by the public archive/feed. Receipt is not publication.
JS preserves drafts on failure; native forms show a receipt with Back guidance.

## Local use

```sh
npm ci
npm run guestbook:migrate
npm run guestbook:build
npm run guestbook:start   # loopback 8094; refuses occupied ports
npm run guestbook:inbox   # newest 20 pending rows, private terminal only
```

All helpers use local D1. State/logs under `.wrangler/` are ignored. Use
`GUESTBOOK_STATE_DIR` and `GUESTBOOK_PORT` for isolated tests. An existing private
Tailscale proxy requires `GUESTBOOK_LOCAL_ORIGIN` set to its exact HTTPS origin.
The local-only guard accepts Wrangler's HTTP URL/Origin rewrite only for that
host/port with `X-Forwarded-Proto: https`. It never grants production access.

Review untrusted notes for spam and private data. Copy only approved fields into
`src/content/guestbook/<unique-kebab-id>.json`: name, note, UTC publishedAt, and
optional model/referrer. Never commit inbox dumps. Check/build and review that
diff before a separately authorized publication. D1 status alone never publishes.
Local bookkeeping/deletion uses `node scripts/guestbook-wrangler.mjs sql
--command '<reviewed SQL>'`; no automatic approval, notifications or retention.

## Before production cutover

Source configuration switches to D1. **This PR does not provision or deploy.**
Configure/migrate the real `DB` binding in each intended Pages environment and
set a private random `GUESTBOOK_IP_SALT` of at least 32 characters. The endpoint
returns 503 until binding, runtime switch and rate configuration are valid.
Verify Cloudflare overwrites `CF-Connecting-IP` on every ingress/subrequest path;
production requires platform metadata and `GUESTBOOK_IP_MODE=trusted-cf`.
Never deploy the dummy local config. Choose aggregate abuse/spend controls,
retention/deletion, reviewer access and notifications before opening intake.

To stop intake, unset runtime `PUBLIC_GUESTBOOK_BACKEND` first (POST becomes 503),
then unset it at build time and rebuild to hide the form while retaining archive.
Rollback to Formspree requires reverting the switch and deliberately restoring
that service; there is no automatic fallback.

## Bounds and limitations

The handler caps streamed UTF-8 bodies at 32 KiB/five seconds, validates bounded
fields and same-origin requests, checks a honeypot, and binds all SQL values.
D1 atomically admits five attempts per address per fixed ten minutes. Only a
salted per-window HMAC is retained, never raw IPs. Local previews share one bucket.
At most 100 expired rate rows are cleaned per submission; cleanup is not a strict
deletion deadline. Private receipts are no-store and submission bodies bypass
analytics middleware.

Fixed-window bursts, shared NATs and distributed/rotating addresses limit this
protection. There is no aggregate cap or managed spam filter. Failed writes may
consume quota; retrying an uncertain receipt may duplicate a note. D1 is not
automatically safer than Formspree, which provides managed filtering, inbox and
notifications and documents a **20 posts/minute per-form** limit (not per-address).
See official [limits](https://help.formspree.io/articles/form-and-project-settings/system-limits),
[spam controls](https://help.formspree.io/articles/troubleshooting/how-to-prevent-spam/)
and [account features](https://help.formspree.io/articles/account-management/account-limits).
No Cam-specific account settings are assumed.

## Verification

`npm run check`, `npm run test:unit`, `npm run test:e2e`, `npm run test:csp`,
`npm run guestbook:build`, `npm run test:d1`. Browser tests mock the local endpoint;
D1 integration uses synthetic notes, a temporary database and a free port, covering
pending readback, restart/concurrency quotas, failure drafts and feed isolation.
Override browser ports with `GUESTBOOK_TEST_PORT`/`GUESTBOOK_EMPTY_TEST_PORT` when
4322/4323 are occupied. No production submissions or remote databases are tested.
