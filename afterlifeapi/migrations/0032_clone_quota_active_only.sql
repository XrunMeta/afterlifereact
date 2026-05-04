-- 정책 변경 (사용자 요구): 클론 삭제 후 같은 타입 재생성 허용.
-- 이전 정책 (0004 migration): "Soft Delete 후 재생성 = 쿼터 소진" — 전역 UNIQUE.
-- 새 정책: active 상태 클론에만 UNIQUE 적용 → soft_deleted 된 항목은 새 INSERT 와 충돌 안 함.
-- 애플리케이션 레벨 COUNT 도 deletion_state='active' 필터 (clones.ts createClone 참고).

DROP INDEX IF EXISTS uniq_clones_owner_type;

CREATE UNIQUE INDEX uniq_clones_owner_type_active
  ON clones(owner_id, clone_type)
  WHERE deletion_state = 'active' AND deleted_at IS NULL;
