-- 사용자 위치 정보 (국가/지역) — xrun 호환.
--
-- 저장 형식 (xrun 동일):
--   country      ISO 3166-1 alpha-2 대문자 ("KR", "US", "JP", "CN", "ID") — NULL 가능
--   mobile_code  국가 전화번호 코드 (82, 1, 81, 86, 62) — NULL 가능
--   region       지역 subcode (xrun regions.ts 의 dialCode 정수). 0 또는 NULL = 없음/Global
--
-- 표시 시 i18n key 로 번역:
--   countries.{ISO2_UPPER}        → "대한민국" / "South Korea" / ...
--   regions.{mobile_code}_{region} → "서울" / "Seoul" / ...
--
-- 회원가입에서 받음. 기존 사용자는 NULL.

ALTER TABLE users ADD COLUMN country      TEXT;
ALTER TABLE users ADD COLUMN mobile_code  INTEGER;
ALTER TABLE users ADD COLUMN region       INTEGER;

-- 빠른 국가별 통계/필터링을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
