-- 트랙B C3: 통화 대화 학습 동의(선택 opt-in). persons_consent_log(0074)의 user 스케일 미러.
-- users.call_learning_consent = 최신 스냅샷(0=미동의 기본, 1=동의). 이력은 user_consent_log.
ALTER TABLE users ADD COLUMN call_learning_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN call_learning_consent_at INTEGER;

CREATE TABLE IF NOT EXISTS user_consent_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type  TEXT NOT NULL,
  state         TEXT NOT NULL CHECK (state IN ('granted','revoked')),
  terms_version TEXT,
  channel       TEXT,
  changed_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_consent_log_user ON user_consent_log(user_id, consent_type);
