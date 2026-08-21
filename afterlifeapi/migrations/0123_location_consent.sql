-- T-502: 위치기반 서비스 동의 (선택). 통화 시 사용자 현재 위치를 페르소나에게 힌트로 전달.
-- ⚠️ 반드시 `wrangler d1 migrations apply` 흐름으로만 적용. `--file` 직접 적용 금지
--    (ALTER TABLE ADD COLUMN 재실행 시 'duplicate column name' 영구 실패 — 0074/0083/0085/0088 동일 경고).
--
-- users.location_consent = 최신 스냅샷 (0=미동의 기본, 1=동의).
-- 이력은 user_consent_log 재사용 (consent_type='location'로 append, 신규 로그 테이블 없음).
-- 실제 위치 데이터 (lat/lng) 는 저장하지 않음 — 통화 시 실시간 수집·역지오코딩 후 gabia 로만 전달.
ALTER TABLE users ADD COLUMN location_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN location_consent_at INTEGER;  -- unixepoch ms, 최근 동의/철회 시각
