-- Critical 테마 (가): 어드민 WebAuthn (super_admin FIDO2) + 복구코드 + 마스터 코드 해시
-- Critical 테마 (마): clones.last_coowner_reminder_at + opt-out (30일 주기 공동관리자 초대 리마인드)

-- admin_users 확장
-- Note: SQLite ALTER TABLE ADD COLUMN은 UNIQUE 제약 불가 → CREATE UNIQUE INDEX로 대체
ALTER TABLE admin_users ADD COLUMN webauthn_credential_id TEXT;
ALTER TABLE admin_users ADD COLUMN webauthn_public_key TEXT;
ALTER TABLE admin_users ADD COLUMN webauthn_sign_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN recovery_codes_hash TEXT;  -- JSON array of SHA-256 hashes (10개)
ALTER TABLE admin_users ADD COLUMN requires_webauthn INTEGER NOT NULL DEFAULT 0;  -- 1: super_admin 강제

CREATE UNIQUE INDEX idx_admin_users_webauthn ON admin_users(webauthn_credential_id)
  WHERE webauthn_credential_id IS NOT NULL;

-- clones 공동관리자 리마인드 (멤로우 전용)
ALTER TABLE clones ADD COLUMN last_coowner_reminder_at TIMESTAMP;
ALTER TABLE clones ADD COLUMN coowner_reminder_opt_out INTEGER NOT NULL DEFAULT 0;

-- 30일 주기 cron 스윕용
CREATE INDEX idx_clones_coowner_reminder
  ON clones(last_coowner_reminder_at, coowner_reminder_opt_out)
  WHERE clone_type = 'memlow' AND coowner_reminder_opt_out = 0;
