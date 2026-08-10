-- 0113_clone_pipeline.sql
-- clones 에 pipeline 컬럼 추가 (talking-head renderer 선택).
--   'musetalk'      기본 (실시간 립싱크, 기존 서비스 :8600)
--   'echomimic_v3'  실험 (오프라인 자연스러움, 신규 :8650)
-- 기존 페르소나는 default 'musetalk' 로 자동 세팅되어 무영향.
--
-- ⚠️ preview D1 (afterlife-db-preview) 는 대시보드로 이미 실행됨. wrangler CI 재실행
-- 시 duplicate column 로 실패했으나, `d1_migrations` 테이블에 이 파일명을 fake
-- INSERT 하여 skip 하도록 처리 완료 (2026-08-10). production D1 배포 시에도 동일
-- 절차 필요.

ALTER TABLE clones ADD COLUMN pipeline TEXT NOT NULL DEFAULT 'musetalk';

CREATE INDEX IF NOT EXISTS idx_clones_pipeline ON clones(pipeline);
