-- 0097: 통화 과금 컬럼 (T-167).
-- 과금 구간은 started_at(연결)이 아니라 greeted_at(클론 인사 시작)부터다.
-- 기존 레코드는 전부 NULL — 과거 통화는 과금 대상이 아니다.

ALTER TABLE call_sessions ADD COLUMN greeted_at   INTEGER;
ALTER TABLE call_sessions ADD COLUMN allowed_sec  INTEGER;
ALTER TABLE call_sessions ADD COLUMN max_end_at   INTEGER;
ALTER TABLE call_sessions ADD COLUMN billed_sec   INTEGER;
ALTER TABLE call_sessions ADD COLUMN unbilled_sec INTEGER;
ALTER TABLE call_sessions ADD COLUMN billed_at    INTEGER;

-- 2층 방어(스펙 §5.3): 데드라인 초과 세션 스캔용.
CREATE INDEX idx_call_sessions_deadline ON call_sessions(max_end_at)
  WHERE ended_at IS NULL;
