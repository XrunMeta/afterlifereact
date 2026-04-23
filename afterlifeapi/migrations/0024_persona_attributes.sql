CREATE TABLE persona_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clone_id INTEGER NOT NULL REFERENCES clones(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('l1','l2')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_persona_attributes_unique ON persona_attributes(clone_id, level, key);
CREATE INDEX idx_persona_attributes_clone_level ON persona_attributes(clone_id, level);
