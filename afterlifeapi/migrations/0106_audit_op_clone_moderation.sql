-- 0106: T-203 decryption_audit_log.op CHECK 에 클론 모더레이션 op 3개 추가
-- (soft_delete, disable, activate). 0021 과 동일한 rename+recreate 패턴
-- (SQLite 는 CHECK ALTER 직접 불가).
--
-- 관리자의 클론 삭제(soft_delete)·비활성화(disable)·복구(activate) 조작을
-- 기존 HMAC 체인 감사 로그(INSERT-only)에 재사용하기 위함 — 새 테이블 신설 안 함.
-- resource_type='clone', resource_id=클론 id, reason=관리자 입력 사유.

ALTER TABLE decryption_audit_log RENAME TO decryption_audit_log_old;

DROP TRIGGER IF EXISTS decryption_audit_log_no_update;
DROP TRIGGER IF EXISTS decryption_audit_log_no_delete;

CREATE TABLE decryption_audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user','admin','heir','system')),
  actor_id        TEXT NOT NULL,
  ticket_id       TEXT,
  op              TEXT NOT NULL CHECK (op IN ('decrypt','shred','emergency','rotate','chain_verify','v2_migrate','shred_failed','archive_cold','hard_delete','cold_restore','soft_delete','disable','activate')),
  resource_type   TEXT NOT NULL,
  resource_id     TEXT NOT NULL,
  reason          TEXT,
  prev_hash       TEXT,
  row_hash        TEXT NOT NULL,
  ts              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO decryption_audit_log
  (id, actor_type, actor_id, ticket_id, op, resource_type, resource_id, reason, prev_hash, row_hash, ts)
SELECT
  id, actor_type, actor_id, ticket_id, op, resource_type, resource_id, reason, prev_hash, row_hash, ts
FROM decryption_audit_log_old;

DROP TABLE decryption_audit_log_old;

CREATE INDEX idx_decryption_audit_actor ON decryption_audit_log(actor_type, actor_id, ts DESC);
CREATE INDEX idx_decryption_audit_resource ON decryption_audit_log(resource_type, resource_id, ts DESC);
CREATE INDEX idx_decryption_audit_ts ON decryption_audit_log(ts DESC);

CREATE TRIGGER decryption_audit_log_no_update
BEFORE UPDATE ON decryption_audit_log
BEGIN
  SELECT RAISE(ABORT, 'decryption_audit_log is INSERT-only');
END;

CREATE TRIGGER decryption_audit_log_no_delete
BEFORE DELETE ON decryption_audit_log
BEGIN
  SELECT RAISE(ABORT, 'decryption_audit_log is INSERT-only');
END;
