-- 0084_face_calibrate_samples.sql
-- T-067 관찰 계측(재캘리브 수집) 임시 테이블 · T-111 개통 전 제거(DROP) 대상.
-- additive · idempotent · `wrangler d1 migrations apply` 로만 적용.
-- FK 없음(의도): 폐기 예정 계측 버퍼로 감사증적 아님. person_id는 문자열 스냅샷.
CREATE TABLE IF NOT EXISTS face_calibrate_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ground_truth_person_id TEXT,
  matched_person_id TEXT,
  best_score REAL NOT NULL,
  threshold REAL NOT NULL,
  scores_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fcs_user_id ON face_calibrate_samples(user_id, id);
