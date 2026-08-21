-- T-502: agreements 테이블의 CHECK 제약 (type IN (1, 2)) 을 (1, 2, 3, 4, 5) 로 확장.
-- 원인: xrun 원본에서 상속된 낡은 스키마가 프로덕션에 남아 있어 type 3/4/5 저장 불가.
-- SQLite 는 ALTER TABLE 로 CHECK 못 바꿈 → 새 테이블 생성 + 데이터 이관 + swap.
--
-- ⚠️ 마이그 idempotent: agreements_new 존재 여부 체크. 재실행 시 duplicate table 오류 방지.
-- 스키마: 기존과 동일 (type/language/content/updated_at/updated_by/PK), CHECK 만 확장.

CREATE TABLE IF NOT EXISTS agreements_new (
  type       INTEGER NOT NULL,
  language   TEXT    NOT NULL,
  content    TEXT    NOT NULL DEFAULT '',
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  PRIMARY KEY (type, language),
  CHECK (type IN (1, 2, 3, 4, 5))
);

INSERT OR IGNORE INTO agreements_new (type, language, content, updated_at, updated_by)
  SELECT type, language, content, updated_at, updated_by FROM agreements;

DROP TABLE agreements;
ALTER TABLE agreements_new RENAME TO agreements;
