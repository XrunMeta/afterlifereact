-- T-126: 얼굴 생체정보 동의 온보딩 + 조용한 자동등록.
-- ⚠️ 반드시 `wrangler d1 migrations apply` 흐름으로만 적용. `--file` 직접 적용 금지
--    (ALTER TABLE ADD COLUMN 재실행 시 'duplicate column name' 영구 실패 — 0074/0083/0085 동일 경고).
--
-- users.face_biometric_consent = 최신 스냅샷(0=미동의 기본, 1=동의). 이력은 user_consent_log
-- (0085에서 이미 생성된 테이블 재사용 — consent_type='face_biometric'로 append, 신규 로그 테이블 없음).
ALTER TABLE users ADD COLUMN face_biometric_consent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN face_consent_at INTEGER;          -- unixepoch ms, 최근 동의/철회 시각
ALTER TABLE users ADD COLUMN face_consent_version TEXT;        -- 동의를 받은(또는 물어본) 약관 버전.
                                                                 -- NULL = 아직 한 번도 안 물어봄(소급
                                                                 -- 프롬프트 대상 판정 기준, T-126 Task11).

-- persons.enrolled_via — 'card'(현행 통화 중 동의카드 수동등록, 기본값) |
-- 'auto_biometric'(약관 동의 기반 조용한 자동등록, T-126). 기존 행은 전부 'card'로 소급(무해·회귀 0).
-- 철회 시(POST /oth-path'revoked'}) enrolled_via='auto_biometric' person만
-- 연쇄 삭제 대상 — 'card' person(기존 동의 카드로 등록한 사용자)은 영향받지 않는다.
ALTER TABLE persons ADD COLUMN enrolled_via TEXT NOT NULL DEFAULT 'card'
  CHECK (enrolled_via IN ('card','auto_biometric'));
