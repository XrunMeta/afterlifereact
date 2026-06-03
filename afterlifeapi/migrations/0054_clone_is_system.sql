-- SP3: 시스템 클론 플래그. 시스템 소유 클론(halbae 등)은 모든 인증 사용자 통화 허용.
-- GET /oth-path 노출과 통화 권한 게이트의 불일치 해소.
-- 주의: ALTER ADD COLUMN 은 멱등 아님 — 재적용 시 "duplicate column" 에러 발생.
-- 기존 ALTER 마이그 패턴(0048 등)과 동일 방식 사용.
ALTER TABLE clones ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;
UPDATE clones SET is_system = 1 WHERE username = 'halbae';
