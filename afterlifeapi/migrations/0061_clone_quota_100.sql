-- 0061_clone_quota_100.sql
-- 정책 변경 (사용자 요구): 클론(페르소나) 최대 개수 4개 → 100개.
--
-- 4개 제한의 근원 = UNIQUE(owner_id, clone_type) (0004→0032→0044, 현행 uniq_clones_owner_type_active).
-- clone_type 4종(friend/mentor/celeb/memlow) 각 1개씩만 허용 → 최대 4개.
-- clone_type 은 이미 deprecated(항상 'friend')이므로 이 제약은 자동 swap 으로
-- 4개를 강제하는 역할만 한다(clones.ts createClone). 제약을 제거해 같은 clone_type
-- 다수 active 를 허용하고, 개수 상한은 앱 레벨(clones.ts) 100개로 둔다.
--
-- idempotent: 모든 구문 IF EXISTS / IF NOT EXISTS.

DROP INDEX IF EXISTS uniq_clones_owner_type_active;  -- 0032/0044 현행 partial UNIQUE
DROP INDEX IF EXISTS uniq_clones_owner_type;          -- 0004 전역 UNIQUE 잔재 방어

-- 쿼터 COUNT(owner_id, active) 조회 성능용 비-UNIQUE 인덱스(제약 아님).
CREATE INDEX IF NOT EXISTS idx_clones_owner_active
  ON clones(owner_id)
  WHERE deletion_state = 'active' AND deleted_at IS NULL;
