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
--
-- sei 게이트 정정 — rebuild 순서를 RENAME-first로: 원래(CREATE new → INSERT SELECT → DROP old →
-- RENAME new→목표이름) 순서는 "DROP 성공 직후 RENAME 전" 중단 시 목표 이름(persons_consent_log)이
-- 잠시도 아니라 **영구적으로** 사라지고, 재실행해도 그 시점 이후 statement(INSERT SELECT FROM
-- persons_consent_log)가 원본을 못 찾아 재실행이 고착되는 치명적 실패모드가 있었다. 아래 새 순서는
-- ①원본을 목표 이름에서 먼저 비켜세우고(RENAME) ②목표 이름으로 새 스키마를 만들고 ③데이터를
-- 목표 이름으로 복사 — 이 ③이 끝나는 순간부터 앱은 이미 올바른 최종 상태(person_consent_log가
-- 목표 이름·새 스키마·전체 데이터 보유)이므로, 그 뒤의 DROP(④, 옛 테이블 정리)이 어느 이유로건
-- 실행되지 못해도 기능적으로 무해(고아 백업 테이블만 남고 수동 정리하면 됨) — 최악의 실패모드가
-- "목표 이름이 완전히 사라짐"에서 "무해한 임시 테이블 잔존"으로 격하됨.
-- (①RENAME 자체가 실행되는 그 찰나의 위험은 0074의 ALTER TABLE ADD COLUMN과 동일 범주의, 제거
-- 불가능한 잔여 위험 — 아래 "반드시 wrangler d1 migrations apply 흐름으로만" 규약으로 절차적으로
-- 방어한다. 이 규약을 어기고 수동 재실행하지 않는 한 이 창은 열리지 않는다.)
-- additive — old 백업 테이블은 DROP TABLE IF EXISTS로, ③ 데이터 복사는 NOT EXISTS 가드로 이중
-- 실행(수동 재실행) 시에도 행 중복이 생기지 않도록 방어.
--
-- ⚠️ 0074/0082 규약과 동일: 반드시 `wrangler d1 migrations apply` 흐름으로만 적용할 것.
--    `wrangler d1 execute --file 0083_consent_log_drop_fk.sql` 직접 적용 절대 금지.
-- ⚠️ 0074는 이미 적용된 마이그라 직접 수정하지 않는다 — 이 파일이 최종 정정본.
--
-- ⚠️ 운영(preview/production) 적용 직전 체크 2줄(이 테이블은 DELETE가 없는 append-only 전제 —
-- 만약 과거에 수동으로 행을 지운 적이 있다면 AUTOINCREMENT 시퀀스와 MAX(id)가 어긋날 수 있으니
-- 적용 전 아래 두 쿼리로 확인):
--   1) SELECT COUNT(*) FROM persons_consent_log;                                    -- 현재 행수 파악
--   2) SELECT seq FROM sqlite_sequence WHERE name='persons_consent_log';            -- 와 MAX(id) 비교
--      SELECT MAX(id) FROM persons_consent_log;                                     -- 두 값이 같아야
--      정상(= 이 테이블에 DELETE가 없었다는 전제가 유효). 다르면 원인 파악 후 적용.

-- ① 원본을 목표 이름에서 비켜세운다(원본 데이터·스키마 그대로, 이름만 변경).
ALTER TABLE persons_consent_log RENAME TO persons_consent_log_old;

-- ② 목표 이름으로 새 스키마(FK 없음) 생성.
CREATE TABLE IF NOT EXISTS persons_consent_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id     INTEGER NOT NULL, -- FK 의도적으로 없음(tombstone 참조 허용, 위 주석 참고)
  state         TEXT NOT NULL CHECK (state IN ('granted','revoked')),
  terms_version TEXT,
  channel       TEXT,
  changed_at    INTEGER NOT NULL
);

-- ③ 데이터 복사 — 이 문장이 끝나는 순간부터 앱은 이미 올바른 최종 상태. NOT EXISTS 가드로
--    수동 재실행 시 중복 삽입 방지.
INSERT INTO persons_consent_log (id, person_id, state, terms_version, channel, changed_at)
  SELECT old.id, old.person_id, old.state, old.terms_version, old.channel, old.changed_at
  FROM persons_consent_log_old AS old
  WHERE NOT EXISTS (
    SELECT 1 FROM persons_consent_log AS cur WHERE cur.id = old.id
  );

-- ④ 옛 테이블 정리(순수 cleanup — 이 시점 이후 실패해도 기능 영향 없음).
DROP TABLE IF EXISTS persons_consent_log_old;

-- ⑤ 인덱스 재생성(DROP TABLE 시 함께 사라졌으므로).
CREATE INDEX IF NOT EXISTS idx_consent_log_person ON persons_consent_log(person_id);
