CREATE TABLE guestbook_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
  note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 2000),
  model TEXT CHECK(length(model) <= 80),
  referrer TEXT CHECK(length(referrer) <= 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'rejected'))
);
CREATE TABLE guestbook_rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX guestbook_rate_expiry ON guestbook_rate_limits(expires_at);
