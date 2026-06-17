-- 0067: user_warnings 에 report_type 추가 — 신고 타입별 id 충돌 방지.
--   user_reports / clone_reports / comment_reports 는 각각 독립 id 시퀀스라
--   report_id 만으로는 멱등성(중복 경고 방지) 키가 충돌함.
--   (예: user_report id=5 와 comment_report id=5)
--   기존 행은 전부 user_reports 기반이므로 기본값 'user' 로 backfill.
ALTER TABLE user_warnings ADD COLUMN report_type TEXT NOT NULL DEFAULT 'user';
