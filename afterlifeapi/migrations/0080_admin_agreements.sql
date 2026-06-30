-- 0080_admin_agreements.sql
-- 에프터라이프 이용약관 관리 — xrun-admin /afterlife/agreements 페이지에서 CRUD
--
-- 타입:
--   1 = 서비스 약관
--   2 = 개인정보 처리방침
-- (xrun 의 위치 정보 약관 (type=3) 은 에프터라이프 미사용)
--
-- 정책:
--   - (type, language) 복합 PK — 언어별 1행
--   - ko 폴백 — 다른 언어 데이터 없으면 사용자 화면에서 한국어로 폴백
--   - updated_by — admin email (xrun-admin bridge 의 경우 'xrun-admin-bridge')

CREATE TABLE IF NOT EXISTS agreements (
  type       INTEGER NOT NULL,
  language   TEXT    NOT NULL,
  content    TEXT    NOT NULL DEFAULT '',
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  PRIMARY KEY (type, language),
  CHECK (type IN (1, 2))
);

CREATE INDEX IF NOT EXISTS idx_agreements_type ON agreements(type);
