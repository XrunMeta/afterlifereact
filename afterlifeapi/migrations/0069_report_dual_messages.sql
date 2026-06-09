-- 0069: 신고 처리 메시지를 둘로 분리.
--   reporter_message = 신고자에게 보일 문구 (앱 '신고 관리' 탭).
--   target_message   = 신고당한 유저에게 보일 문구 (앱 '신고당한 내역' 탭, 경고 사유).
--   기존 admin_message 는 호환 위해 유지(= target_message 와 동기화). 기존 값은 양쪽으로 backfill.

ALTER TABLE user_reports    ADD COLUMN reporter_message TEXT;
ALTER TABLE user_reports    ADD COLUMN target_message   TEXT;
ALTER TABLE clone_reports   ADD COLUMN reporter_message TEXT;
ALTER TABLE clone_reports   ADD COLUMN target_message   TEXT;
ALTER TABLE comment_reports ADD COLUMN reporter_message TEXT;
ALTER TABLE comment_reports ADD COLUMN target_message   TEXT;

-- 기존 단일 메시지를 양쪽에 복사 (과거 처리분 표시 유지).
UPDATE user_reports    SET reporter_message = admin_message, target_message = admin_message WHERE admin_message IS NOT NULL;
UPDATE clone_reports   SET reporter_message = admin_message, target_message = admin_message WHERE admin_message IS NOT NULL;
UPDATE comment_reports SET reporter_message = admin_message, target_message = admin_message WHERE admin_message IS NOT NULL;
