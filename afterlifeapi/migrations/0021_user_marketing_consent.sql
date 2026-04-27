-- 가입 시 마케팅 정보 수신 동의 여부.
-- 동의 시 푸시 알림 권한도 OS에 요청 (프론트 책임).
ALTER TABLE users ADD COLUMN marketing_consent INTEGER NOT NULL DEFAULT 0;
