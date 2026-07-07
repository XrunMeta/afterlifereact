-- 0087_guide_kind_and_urls.sql
-- T-116 B: (1) clone_asset_jobs.kind CHECK에 'guide' 허용 추가
--          (2) clones.guide_video_urls TEXT DEFAULT NULL 추가
-- 0079(filler) 패턴 동일 — 테이블 재작성 + idempotent.
-- ⚠️ 번호 정정: brief 작성 시점(0084 최신) 대비 0085/0086이 통화학습동의 트랙(call_learning_consent)에
--    선점되어 있어 0087로 진행. kind 리터럴·컬럼명은 brief 그대로.

DROP TABLE IF EXISTS _clone_asset_jobs_new;

CREATE TABLE _clone_asset_jobs_new (
  id             TEXT    PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind           TEXT    NOT NULL CHECK (kind IN ('idle_video','voice_clone','filler','guide')),
  src_file_id    INTEGER NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  status         TEXT    NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','running','done','failed')),
  out_file_id    INTEGER REFERENCES files(id) ON DELETE SET NULL,
  out_url        TEXT,
  clone_id       INTEGER REFERENCES clones(id) ON DELETE SET NULL,
  callback_token TEXT,
  error          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO _clone_asset_jobs_new (id, user_id, kind, src_file_id, status, out_file_id, out_url, clone_id, callback_token, error, created_at, updated_at)
SELECT id, user_id, kind, src_file_id, status, out_file_id, out_url, clone_id, callback_token, error, created_at, updated_at
FROM clone_asset_jobs;

DROP TABLE clone_asset_jobs;
ALTER TABLE _clone_asset_jobs_new RENAME TO clone_asset_jobs;

CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_user    ON clone_asset_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_clone   ON clone_asset_jobs(clone_id);
CREATE INDEX IF NOT EXISTS idx_clone_asset_jobs_out_url ON clone_asset_jobs(out_url);

ALTER TABLE clones ADD COLUMN guide_video_urls TEXT;
