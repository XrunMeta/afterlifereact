-- afterlifeapi/migrations/0081_app_config.sql
-- 범용 런타임 설정 key-value. 1차 용도 = 통화 엔드포인트 원격 config(call-config).
--   key 네임스페이스: call.prethird_base / call.route / call.second_base
--   값 변경 = UPDATE app_config SET value=?, updated_at=unixepoch() WHERE key=? (재배포 불필요)
-- seed = 현재 라이브 값(rtc.example.invalid). call.second_base 는 seed 안 함(값 없으면 앱 하드코딩 유지).
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('call.prethird_base', 'https://rtc.example.invalid/prethird'),
  ('call.route',         'prethird');
