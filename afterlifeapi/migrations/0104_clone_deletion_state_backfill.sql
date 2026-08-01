-- 0104: T-201 클론 삭제 상태 필드 백필.
--
-- clones 테이블은 deleted_at(레거시, 0001_init) 과 deletion_state/soft_deleted_at
-- (0013_deletion_state 이후 도입된 3단계 상태머신) 두 계통이 공존한다.
-- 사용자 셀프 삭제(routes/deletion.ts) 는 과거 deletion_state 만 세팅하고
-- deleted_at 은 cleanup cron 의 orphan-sweep(현재 기본 OFF)이 우연히 채워줄 때까지
-- NULL 로 남는 과도기 행을 만들었다 — "삭제한 클론이 계속 노출" 버그의 근본 원인.
--
-- 조회 경로 다수가 deleted_at IS NULL 만 검사했기 때문에 이 갭이 있는 행은
-- 삭제 후에도 계속 노출됐다. 코드 쪽은 이번 T-201 로 deletion_state 도 함께
-- 보는 단일 술어(cloneActiveSql)로 정합화했고, 이 마이그는 이미 존재하는
-- 불일치 데이터를 백필한다.
--
-- 대상: deletion_state != 'active' 인데 deleted_at 이 NULL 인 행 전부
--   (soft_deleted 뿐 아니라 archived_cold/hard_deleted 도 동일 갭이 있을 수 있어 함께 처리).
-- deleted_at 값은 soft_deleted_at → archived_cold_at → 실행 시각 순으로 채운다
--   (실제 삭제/전이 시각에 최대한 가깝게).
--
-- ⚠️ deletion_state = 'active' 인 행은 절대 건드리지 않는다(정상 클론 노출 유지 — 회귀 1순위).

UPDATE clones
   SET deleted_at = COALESCE(soft_deleted_at, archived_cold_at, CURRENT_TIMESTAMP)
 WHERE deletion_state != 'active'
   AND deleted_at IS NULL;
