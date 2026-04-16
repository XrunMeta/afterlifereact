-- Critical 테마 (바) Slice 2: decryption_audit_log.op CHECK에 'v2_migrate' 추가.
-- SQLite는 ALTER TABLE로 CHECK 변경이 안 되므로 rename → create → copy → drop 방식.

ALTER TABLE decryption_audit_log RENAME TO decryption_audit_log_old;

DROP TRIGGER IF EXISTS decryption_audit_log_no_update;
DROP TRIGGER IF EXISTS decryption_audit_log_no_delete;

CREATE TABLE decryption_audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('user','admin','heir','system')),
  actor_id        TEXT NOT NULL,
  ticket_id       TEXT,
  op              TEXT NOT NULL CHECK (op IN ('decrypt','shred','emergency','rotate','chain_verify','v2_migrate')),
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
