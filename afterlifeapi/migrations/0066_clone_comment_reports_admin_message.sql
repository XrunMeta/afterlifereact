-- 0066: clone_reports / comment_reports 에 admin_message 컬럼 추가.
--   user_reports 와 동일 — 수락/거절 처리 시 admin 이 입력하는 메모.
--   앱에서 신고자/대상자에게 노출 가능 (후속 기능).

ALTER TABLE clone_reports   ADD COLUMN admin_message TEXT;
ALTER TABLE comment_reports ADD COLUMN admin_message TEXT;
