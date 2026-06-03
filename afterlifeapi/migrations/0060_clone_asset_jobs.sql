-- depends: files 테이블(0001_init.sql) — files CREATE 마이그 번호 0001
-- 0060_clone_asset_jobs.sql — 비동기 자산 잡 + clones 결과 컬럼(additive).
ALTER TABLE clones ADD COLUMN idle_video_url TEXT;
ALTER TABLE clones ADD COLUMN voice_se_url   TEXT;

CREATE TABLE clone_asset_jobs (
  id             TEXT PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('idle_video','voice_clone')),
  src_file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  out_file_id    INTEGER REFERENCES files(id) ON DELETE SET NULL,
  out_url        TEXT,
  clone_id       INTEGER REFERENCES clones(id) ON DELETE SET NULL,
  callback_token TEXT,
  error          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_clone_asset_jobs_user ON clone_asset_jobs(user_id, status);
CREATE INDEX idx_clone_asset_jobs_clone ON clone_asset_jobs(clone_id);
