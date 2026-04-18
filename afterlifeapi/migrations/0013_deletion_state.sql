-- Critical 테마 (바): 3단계 삭제 상태머신
-- active → soft_deleted (90d) → archived_cold (275d, 총 1년) → hard_deleted
-- 기본값 active. cleanup cron이 단계 전이. DEK 보관 유지(기본), GDPR 명시 요청 시만 Crypto Shredding.

ALTER TABLE users ADD COLUMN deletion_state TEXT NOT NULL DEFAULT 'active'
  CHECK (deletion_state IN ('active','soft_deleted','archived_cold','hard_deleted'));
ALTER TABLE users ADD COLUMN soft_deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN archived_cold_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP;

ALTER TABLE clones ADD COLUMN deletion_state TEXT NOT NULL DEFAULT 'active'
  CHECK (deletion_state IN ('active','soft_deleted','archived_cold','hard_deleted'));
ALTER TABLE clones ADD COLUMN soft_deleted_at TIMESTAMP;
ALTER TABLE clones ADD COLUMN archived_cold_at TIMESTAMP;

ALTER TABLE messages ADD COLUMN deletion_state TEXT NOT NULL DEFAULT 'active'
  CHECK (deletion_state IN ('active','soft_deleted','archived_cold','hard_deleted'));

-- cleanup cron 스윕용 인덱스
CREATE INDEX idx_users_deletion_state ON users(deletion_state, soft_deleted_at)
  WHERE deletion_state IN ('soft_deleted','archived_cold');
CREATE INDEX idx_clones_deletion_state ON clones(deletion_state, soft_deleted_at)
  WHERE deletion_state IN ('soft_deleted','archived_cold');
CREATE INDEX idx_messages_deletion_state ON messages(deletion_state, created_at)
  WHERE deletion_state != 'active';

-- 365일 미활동 감지용
CREATE INDEX idx_users_last_activity ON users(last_activity_at)
  WHERE deletion_state = 'active';
