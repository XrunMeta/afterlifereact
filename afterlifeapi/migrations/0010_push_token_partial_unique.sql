-- Critical 테마 (사): push_token 전역 UNIQUE → 활성 토큰만 UQ로 변경
-- 비활성(is_active=0) 토큰은 중복 허용 → 재로그인/디바이스 교체 시나리오 지원
-- 30일 미사용 토큰은 별도 cron에서 is_active=0으로 전환

DROP INDEX IF EXISTS idx_user_devices_push_token;

CREATE UNIQUE INDEX idx_user_devices_push_token_active
  ON user_devices(push_token)
  WHERE is_active = 1;

-- 비활성 토큰 조회/정리 cron 용 보조 인덱스
CREATE INDEX idx_user_devices_inactive
  ON user_devices(is_active, last_active_at)
  WHERE is_active = 0;
