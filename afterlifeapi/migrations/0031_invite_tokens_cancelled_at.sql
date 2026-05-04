-- 0031_invite_tokens_cancelled_at.sql
-- pending invite 취소 흐름을 위해 cancelled_at TIMESTAMP 컬럼 추가.
-- NULL = 미취소(active), 값 = 취소 시각.
-- accept 단계와 list 단계에서 cancelled_at IS NULL 조건 추가됨.

ALTER TABLE invite_tokens ADD COLUMN cancelled_at TIMESTAMP;

-- 인덱스: clone_id별 active(미사용·미취소·미만료) 토큰 조회 최적화
CREATE INDEX IF NOT EXISTS idx_invite_tokens_active
  ON invite_tokens (clone_id, used_at, cancelled_at, expires_at);
