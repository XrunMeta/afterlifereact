-- 트랙B C3: 통화 대화 학습 동의(선택 opt-in). persons_consent_log(0074)의 user 스케일 미러.
-- ⚠️ 반드시 `wrangler d1 migrations apply` 흐름으로만 적용. `--file` 직접 적용 금지
--    (ALTER TABLE ADD COLUMN 재실행 시 'duplicate column name' 영구 실패 — 0074/0083 동일 경고).
-- users.call_learning_consent = 최신 스냅샷(0=미동의 기본, 1=동의). 이력은 user_consent_log.
ALTER TABLE users ADD COLUMN call_learning_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN call_learning_consent_at INTEGER;

-- 감사증적(GDPR Art.7 동의 입증책임): user 하드삭제 이후에도 이력 존속해야 함.
-- ⚠️ user_id에 FK 없음(의도) — 0083이 persons_consent_log에서 ON DELETE CASCADE로
--    감사행이 삭제와 함께 소멸하는 버그를 실측·수정한 교훈. tombstone 참조 허용.
CREATE TABLE IF NOT EXISTS user_consent_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  consent_type  TEXT NOT NULL,
  state         TEXT NOT NULL CHECK (state IN ('granted','revoked')),
  terms_version TEXT,
  channel       TEXT,
  changed_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_consent_log_user ON user_consent_log(user_id, consent_type);
