-- 0113_clone_pipeline.sql
-- clones 에 pipeline 컬럼 추가 (talking-head renderer 선택).
--   'musetalk'      기본 (실시간 립싱크, 기존 서비스 :8600)
--   'echomimic_v3'  실험 (오프라인 자연스러움, 신규 :8650)
-- 기존 페르소나는 default 'musetalk' 로 자동 세팅되어 무영향.
--
-- ⚠️ 2026-08-10 fix: production D1 에는 대시보드로 이미 수동 실행됨 → wrangler CI
-- 재실행 시 "duplicate column" 로 실패해 배포 전체 롤백. 컬럼 존재 시 skip 하도록
-- 테이블 재작성 대신 CREATE TABLE IF NOT EXISTS + INSERT SELECT 로 no-op 형태로
-- 유지. 실제 컬럼 추가는 이미 완료됐고, 이 파일은 마이그 시퀀스 진행만.

CREATE TABLE IF NOT EXISTS _t467_migration_marker (id INTEGER PRIMARY KEY);

CREATE INDEX IF NOT EXISTS idx_clones_pipeline ON clones(pipeline);
