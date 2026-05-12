-- 사용자 위치 정보 (국가/지역) — xrun 호환 + 다국가 확장.
--
-- 저장 형식:
--   country      ISO 3166-1 alpha-2 대문자 ("KR", "US", "JP", "CN", "ID", "FR", ...)
--   mobile_code  국가 전화번호 코드 (82, 1, 81, 86, 62, 33, ...)
--   region       TEXT — 한국/인도네시아는 xrun subcode 문자열 ("2"=서울),
--                그 외 250개국은 country-state-city 의 ISO 3166-2 subdivision
--                코드 ("CA"=California, "75"=Paris, ...). 표시 시 i18n key
--                (regions.{mobile_code}_{region}) 매칭 시도, 없으면 패키지의
--                영문 name 그대로 노출.
--
-- 회원가입에서 받음. 기존 사용자는 NULL.

ALTER TABLE users ADD COLUMN country      TEXT;
ALTER TABLE users ADD COLUMN mobile_code  INTEGER;
ALTER TABLE users ADD COLUMN region       TEXT;

-- 빠른 국가별 통계/필터링을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
