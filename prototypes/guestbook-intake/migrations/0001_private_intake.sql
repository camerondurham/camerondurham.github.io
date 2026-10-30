-- This database is private intake only. It is NEVER bound to Pages or its build.
CREATE TABLE private_submissions (
  request_hash TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  submitter_hash TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
  note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 2000),
  model TEXT NOT NULL DEFAULT '' CHECK(length(model) <= 80),
  referrer TEXT NOT NULL DEFAULT '' CHECK(length(referrer) <= 200),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  received_day TEXT NOT NULL DEFAULT (date('now')),
  received_hour TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H', 'now')),
  review_state TEXT NOT NULL DEFAULT 'pending'
    CHECK(review_state IN ('pending', 'reviewed', 'rejected')),
  UNIQUE(received_day, payload_hash)
);
CREATE INDEX private_submitter_hour ON private_submissions(submitter_hash, received_hour);
CREATE INDEX private_created_at ON private_submissions(created_at);

-- Enforce admission in the same atomic INSERT as the stored note. SELECT-then-
-- INSERT in application code would race. Reviewed/rejected notes still count.
-- Existing idempotency/content duplicates do not consume another admission.
CREATE TRIGGER private_admission_limit BEFORE INSERT ON private_submissions
WHEN NOT EXISTS(SELECT 1 FROM private_submissions WHERE request_hash = NEW.request_hash)
 AND NOT EXISTS(SELECT 1 FROM private_submissions
                WHERE received_day = NEW.received_day AND payload_hash = NEW.payload_hash)
BEGIN
  SELECT RAISE(ABORT, 'guestbook_daily_limit')
    WHERE (SELECT COUNT(*) FROM private_submissions WHERE received_day = NEW.received_day) >= 50;
  SELECT RAISE(ABORT, 'guestbook_ip_limit')
    WHERE (SELECT COUNT(*) FROM private_submissions
            WHERE submitter_hash = NEW.submitter_hash AND received_hour = NEW.received_hour) >= 3;
END;
