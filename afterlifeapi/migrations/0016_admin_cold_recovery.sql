-- Critical 테마 (가) C단계: Cold Recovery 마스터 코드
-- 모든 super_admin이 2FA 장치/복구코드를 모두 분실했을 때의 최후 수단.
-- 금고에 보관되는 마스터 코드 1개(평문)로 특정 admin의 TOTP+WebAuthn+복구코드를 초기화.
-- MVP: 마스터 코드 1개 sha256 해시만 DB에 보관. SSS 5/3 분산은 Launch 단계로 연기.

CREATE TABLE admin_cold_recovery (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash        TEXT NOT NULL,           -- sha256(secret_b32) hex lowercased
  provisioned_by   INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
                                            -- bootstrap 경로는 NULL
  provisioned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_at      TIMESTAMP,               -- 1회 소진 시점
  consumed_target  INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  consumed_reason  TEXT,                    -- 운영자가 기재한 사유 (감사로그로도 기록)
  revoked_at       TIMESTAMP,               -- 새 코드 발급 시 이전 코드 자동 revoke
  -- 활성 상태(둘 다 NULL)만 1, 그 외 NULL → 부분 UNIQUE 인덱스로 전역 1건 강제
  is_active_flag   INTEGER GENERATED ALWAYS AS (
    CASE WHEN consumed_at IS NULL AND revoked_at IS NULL THEN 1 ELSE NULL END
  ) VIRTUAL,
  CHECK (consumed_at IS NULL OR revoked_at IS NULL)
);

CREATE UNIQUE INDEX idx_admin_cold_recovery_active
  ON admin_cold_recovery(is_active_flag)
  WHERE is_active_flag IS NOT NULL;

CREATE INDEX idx_admin_cold_recovery_hash ON admin_cold_recovery(code_hash);
