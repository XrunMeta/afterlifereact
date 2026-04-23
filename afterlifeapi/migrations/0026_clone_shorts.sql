CREATE TABLE clone_shorts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','processing','ready','failed')) DEFAULT 'queued',
  media_url TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clone_shorts_clone ON clone_shorts(clone_id);
CREATE INDEX idx_clone_shorts_status_ready ON clone_shorts(status) WHERE status = 'ready';
