-- 0075_phaseb_l2_auto_learned.sql
-- Phase B 통화 자동학습: clone_ont 에 마지막 자동학습 시각(unixepoch, INTEGER) 기록 — 모니터링/쿼리용.
-- additive: nullable 컬럼 1개. 기존 행 보존(auto_learned_at IS NULL).
-- ⚠️ 1회만 실행(sei): SQLite 는 ADD COLUMN IF NOT EXISTS 미지원 → 재실행 시
--    'duplicate column name: auto_learned_at' 로 실패. 가능하면 wrangler d1 migrations 흐름으로 적용,
--    --file 직접 실행 시 사전 PRAGMA table_info(clone_ont) 로 컬럼 존재 여부 확인 후 실행.
-- 번호: 브리프 0029 가정은 stale(0028_files.sql 기점유). 세션 A=0074_face_*, C=0075 로 재조율(2026-06-12).
ALTER TABLE clone_ont ADD COLUMN auto_learned_at INTEGER;
