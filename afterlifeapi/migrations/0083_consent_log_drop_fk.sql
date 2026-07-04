-- 0083_consent_log_drop_fk.sql
-- T-067 fix: 생체정보 삭제권(DELETE /oth-path) 구현 중 실측 발견 — Cloudflare D1은
-- **프로덕션에서도 foreign key enforcement가 기본 ON이며 끌 수 없다**
-- (공식 docs "Define foreign keys": 트랜잭션 내 `PRAGMA defer_foreign_keys`만 허용, FK 자체를
-- OFF로 두는 옵션 없음). vitest(D1 로컬 에뮬레이션) 실측도 `PRAGMA foreign_keys` = 1(ON)로 확인.
-- ⚠️ 0074/0082의 "D1 FK enforcement 기본 OFF" 주석은 오류였다(정정, 이 파일에서 최종 정정).
--
-- 실무 영향: 0074가 persons_consent_log를
--   `person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE`
-- 로 선언했는데, 이 테이블은 0074 설계 의도상 **append-only 컴플라이언스 감사증적**(GDPR Art.7)이라
-- person이 삭제된 뒤에도 "누가 언제 어떤 동의를 했는지" 기록이 남아있어야 한다. 그런데 FK가 실제로
-- ON DELETE CASCADE로 동작하는 이상, DELETE /oth-path가 persons 행을 지우는 순간 이 감사
-- 로그까지 통째로 함께 사라진다 — 감사증적이 스스로를 파괴하는 실버그(실측: person 삭제 후
-- persons_consent_log 잔존 행 0건, 삭제 직전에 남긴 'revoked'/'face_delete' 감사행까지 포함해 전부 소멸).
--
-- 수정: persons_consent_log를 FK 없이 재생성(SQLite 표준 rebuild 절차 — ALTER TABLE로 FK 제거 불가).
-- person_id는 "tombstone 참조" 허용: 원본 persons 행이 사라진 뒤에도 person_id 값 자체(정수)는
-- 감사 목적으로 그대로 남는다(고아 참조 허용 — 이 테이블의 존재 이유가 바로 그것).
-- additive·idempotent(재실행 시 old 테이블이 이미 없으면 무해하게 스킵되도록 IF EXISTS/IF NOT EXISTS 사용).
--
-- ⚠️ 0074/0082 규약과 동일: 반드시 `wrangler d1 migrations apply` 흐름으로만 적용할 것.
--    `wrangler d1 execute --file 0083_consent_log_drop_fk.sql` 직접 적용 절대 금지
--    (재실행 시 RENAME 대상 충돌 등으로 부분 상태 위험).
-- ⚠️ 0074는 이미 적용된 마이그라 직접 수정하지 않는다 — 이 파일이 최종 정정본.

CREATE TABLE IF NOT EXISTS persons_consent_log_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id     INTEGER NOT NULL, -- FK 의도적으로 없음(tombstone 참조 허용, 위 주석 참고)
  state         TEXT NOT NULL CHECK (state IN ('granted','revoked')),
  terms_version TEXT,
  channel       TEXT,
  changed_at    INTEGER NOT NULL
);

INSERT INTO persons_consent_log_new (id, person_id, state, terms_version, channel, changed_at)
  SELECT id, person_id, state, terms_version, channel, changed_at FROM persons_consent_log;

DROP TABLE persons_consent_log;

ALTER TABLE persons_consent_log_new RENAME TO persons_consent_log;

CREATE INDEX IF NOT EXISTS idx_consent_log_person ON persons_consent_log(person_id);
