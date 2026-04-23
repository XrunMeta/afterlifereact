ALTER TABLE clones ADD COLUMN primary_editor_user_id INTEGER REFERENCES users(id);
UPDATE clones SET primary_editor_user_id = owner_id WHERE primary_editor_user_id IS NULL;
CREATE INDEX idx_clones_primary_editor_user_id ON clones(primary_editor_user_id);

CREATE TABLE clone_editor_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','accepted','declined','revoked')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved_at TEXT
);
CREATE INDEX idx_cet_clone_status ON clone_editor_transfers(clone_id, status);
CREATE UNIQUE INDEX idx_cet_single_pending
  ON clone_editor_transfers(clone_id)
  WHERE status = 'pending';
