-- Critical 테마 (바) Slice 1: Lazy Rotation + KEK 멀티버전 제약.
-- dek_registry에 rotated_at 컬럼 추가 (재래핑 시점 기록).
-- encryption_keys(status='active')를 부분 UNIQUE로 제약 (동시 활성 1개만).

ALTER TABLE dek_registry ADD COLUMN rotated_at TIMESTAMP;

CREATE UNIQUE INDEX idx_encryption_keys_active
  ON encryption_keys(status)
  WHERE status = 'active';
