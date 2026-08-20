-- T-531M (2026-08-20): 디바이스 차단 (재가입 방지).
--   관리자가 유저에게 device_ban 액션 적용 시 그 유저의 모든 user_devices.device_id 를
--   여기에 INSERT. auth signup/login 이 body.deviceId 로 조회해 차단된 것이면 reject.
--   IP 도 부가 fingerprint 로 함께 기록 (여러 유저가 공유 wifi 쓰면 오탐 위험이라 강제 게이트로는
--   쓰지 않고 관리자 참고 정보로만).

CREATE TABLE IF NOT EXISTS device_bans (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT NOT NULL,
  ip           TEXT,
  banned_user_id INTEGER,           -- 이 device 로 원래 사용하던 유저 (참고)
  admin_id     INTEGER,             -- 밴 부여한 관리자 (audit)
  reason       TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_bans_ip ON device_bans(ip);
CREATE INDEX IF NOT EXISTS idx_device_bans_user ON device_bans(banned_user_id);
